import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NewComment, ReaderComment } from "@/types/comment";

export class CommentStoreError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const unavailable = () =>
  new CommentStoreError(
    503,
    "댓글을 연결하는 중입니다. 잠시 후 다시 방문해주세요.",
  );
function cloudConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (
    !url ||
    !key ||
    !process.env.COMMENT_RATE_SECRET ||
    process.env.COMMENT_RATE_SECRET.length < 32
  )
    return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.pathname !== "/" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    )
      return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
export function commentStorageMode() {
  if (cloudConfig()) return "shared" as const;
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.VERCEL &&
    !process.env.SUPABASE_URL &&
    !process.env.SUPABASE_SECRET_KEY
  )
    return "local" as const;
  return "unavailable" as const;
}
const fields =
  "id,seq,postId:post_id,parentId:parent_id,anchor,color,author,body,createdAt:created_at";
async function cloud(endpoint: string, init?: RequestInit) {
  const config = cloudConfig();
  if (!config) throw unavailable();
  const response = await fetch(`${config.url}/rest/v1/${endpoint}`, {
    ...init,
    headers: {
      apikey: config.key,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.code === "P0429")
      throw new CommentStoreError(
        429,
        "댓글을 잠시 쉬었다가 남겨주세요. 1분에 5개까지 등록할 수 있어요.",
      );
    if (error.code === "P0002")
      throw new CommentStoreError(
        404,
        "원래 댓글이 삭제되었어요. 새로고침 후 다시 시도해주세요.",
      );
    if (error.code === "23505")
      throw new CommentStoreError(
        409,
        "같은 요청이 이미 처리되었습니다. 새로고침 후 확인해주세요.",
      );
    throw unavailable();
  }
  return response.status === 204 ? null : response.json();
}

type StoredComment = ReaderComment & { actor: string };
type LocalData = {
  seq: number;
  comments: StoredComment[];
  rates: Record<string, { since: number; count: number }>;
};
const file = path.join(process.cwd(), ".data", "comments.json");
// Development-only JSON storage is serialized across route handlers and hot reloads.
const state = globalThis as typeof globalThis & {
  sunulogCommentQueue?: Promise<unknown>;
};
async function local<T>(
  action: (data: LocalData) => T,
  write = false,
): Promise<T> {
  const operation = (state.sunulogCommentQueue || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      let data: LocalData;
      try {
        data = JSON.parse(await fs.readFile(file, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        data = { seq: 0, comments: [], rates: {} };
      }
      const result = action(data);
      if (write) {
        await fs.mkdir(path.dirname(file), { recursive: true });
        const temp = `${file}.${randomUUID()}.tmp`;
        await fs.writeFile(temp, JSON.stringify(data), { mode: 0o600 });
        await fs.rename(temp, file);
      }
      return result;
    });
  state.sunulogCommentQueue = operation;
  return operation;
}
function publicComment({
  actor: _actor,
  ...comment
}: StoredComment): ReaderComment {
  return comment;
}
export async function listComments(postId: number, after: number) {
  const mode = commentStorageMode();
  if (mode === "unavailable") throw unavailable();
  const rows: ReaderComment[] =
    mode === "shared"
      ? await cloud(
          `sunulog_comments?${new URLSearchParams({ select: fields, post_id: `eq.${postId}`, seq: `gt.${after}`, order: "seq.asc", limit: "101" })}`,
        )
      : await local((data) =>
          data.comments
            .filter(
              (comment) => comment.postId === postId && comment.seq > after,
            )
            .sort((a, b) => a.seq - b.seq)
            .slice(0, 101)
            .map(publicComment),
        );
  return {
    comments: rows.slice(0, 100),
    nextCursor: rows.length > 100 ? rows[99].seq : null,
    mode,
  };
}
export async function createComment(
  input: NewComment,
  actor: string,
): Promise<ReaderComment> {
  const mode = commentStorageMode();
  if (mode === "unavailable") throw unavailable();
  if (mode === "shared") {
    const row = await cloud("rpc/sunulog_add_comment", {
      method: "POST",
      body: JSON.stringify({ p_input: input, p_actor: actor }),
    });
    return {
      id: row.id,
      seq: row.seq,
      postId: row.post_id,
      parentId: row.parent_id,
      anchor: row.anchor,
      color: row.color,
      author: row.author,
      body: row.body,
      createdAt: row.created_at,
    };
  }
  return local((data) => {
    const existing = data.comments.find((comment) => comment.id === input.id);
    if (existing) {
      if (
        existing.actor !== actor ||
        existing.postId !== input.postId ||
        existing.body !== input.body ||
        existing.parentId !== input.parentId
      )
        throw new CommentStoreError(
          409,
          "이미 처리된 요청입니다. 새로고침 후 확인해주세요.",
        );
      return publicComment(existing);
    }
    const parent = input.parentId
      ? data.comments.find(
          (comment) =>
            comment.id === input.parentId &&
            comment.postId === input.postId &&
            !comment.parentId,
        )
      : null;
    if (input.parentId && !parent)
      throw new CommentStoreError(
        404,
        "원래 댓글이 삭제되었어요. 새로고침 후 다시 시도해주세요.",
      );
    const now = Date.now();
    for (const [key, rate] of Object.entries(data.rates))
      if (now - rate.since > 86400000) delete data.rates[key];
    const rate = data.rates[actor];
    if (rate && now - rate.since < 60000 && rate.count >= 5)
      throw new CommentStoreError(
        429,
        "댓글을 잠시 쉬었다가 남겨주세요. 1분에 5개까지 등록할 수 있어요.",
      );
    data.rates[actor] =
      !rate || now - rate.since >= 60000
        ? { since: now, count: 1 }
        : { since: rate.since, count: rate.count + 1 };
    const comment: StoredComment = {
      ...input,
      color: parent?.color || input.color,
      actor,
      seq: ++data.seq,
      createdAt: new Date().toISOString(),
    };
    data.comments.push(comment);
    return publicComment(comment);
  }, true);
}
export async function removeComment(postId: number, id: string) {
  const mode = commentStorageMode();
  if (mode === "unavailable") throw unavailable();
  if (mode === "shared")
    await cloud(
      `sunulog_comments?${new URLSearchParams({ post_id: `eq.${postId}`, id: `eq.${id}` })}`,
      { method: "DELETE" },
    );
  else
    await local((data) => {
      data.comments = data.comments.filter(
        (comment) =>
          comment.postId !== postId ||
          (comment.id !== id && comment.parentId !== id),
      );
    }, true);
}
