import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getPostById } from "@/lib/posts";
import { limitedBody } from "@/lib/local-api";
import { adminApiError } from "@/lib/auth";
import { parseComment, uuidPattern } from "@/lib/comment-validation";
import {
  CommentStoreError,
  createComment,
  listComments,
  removeComment,
} from "@/lib/comment-store";
import { markdownText } from "@/lib/comment-text";
import { makeAnchor, resolveAnchor } from "@/lib/annotations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}
function failure(error: unknown) {
  if (error instanceof CommentStoreError)
    return json({ error: error.message }, error.status);
  if (error instanceof RangeError)
    return json({ error: "댓글이 너무 깁니다." }, 413);
  if (error instanceof SyntaxError)
    return json({ error: "댓글 형식을 확인해주세요." }, 400);
  return json(
    {
      error: "댓글을 불러오거나 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
    },
    503,
  );
}
export async function GET(request: NextRequest) {
  const postId = Number(request.nextUrl.searchParams.get("postId"));
  const after = Number(request.nextUrl.searchParams.get("after") || 0);
  if (
    !Number.isSafeInteger(postId) ||
    postId <= 0 ||
    !Number.isSafeInteger(after) ||
    after < 0
  )
    return json({ error: "글 주소를 확인해주세요." }, 400);
  if (!getPostById(postId))
    return json({ error: "글을 찾을 수 없습니다." }, 404);
  try {
    return json(await listComments(postId, after));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  let trustedOrigin = false;
  try {
    const origin = request.headers.get("origin") || "";
    const url = new URL(origin);
    trustedOrigin =
      origin === url.origin &&
      url.host === request.headers.get("host") &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
  } catch {
    /* Missing or malformed origins cannot submit comments. */
  }
  if (
    !trustedOrigin ||
    !request.headers.get("content-type")?.includes("application/json")
  )
    return json({ error: "블로그의 댓글 창에서 다시 등록해주세요." }, 403);
  try {
    const value = JSON.parse(
      (await limitedBody(request, 16384)).toString("utf8"),
    );
    const input = parseComment(value);
    if (!input)
      return json(
        {
          error:
            "댓글은 2,000자, 이름은 24자, 선택 문장은 500자 이내로 작성해주세요.",
        },
        400,
      );
    const post = getPostById(input.postId);
    if (!post) return json({ error: "글을 찾을 수 없습니다." }, 404);
    if (input.anchor) {
      const page = post.pages[input.anchor.page];
      if (!page)
        return json(
          { error: "선택한 문장을 찾지 못했어요. 본문을 다시 선택해주세요." },
          409,
        );
      const text = markdownText(page.content);
      const range = resolveAnchor(text, input.anchor);
      if (!range)
        return json(
          { error: "본문이 바뀌었어요. 새로고침 후 문장을 다시 선택해주세요." },
          409,
        );
      input.anchor = makeAnchor(
        text,
        input.anchor.page,
        range.start,
        range.end,
      );
    }
    const secret =
      process.env.COMMENT_RATE_SECRET ||
      (process.env.NODE_ENV === "development" && !process.env.VERCEL
        ? "local-development-only"
        : "");
    if (!secret)
      return json({ error: "댓글 연결 설정이 아직 완료되지 않았습니다." }, 503);
    // Vercel replaces x-forwarded-for at its trusted ingress. Never persist raw IPs.
    const ip = process.env.VERCEL
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "local";
    const actor = createHmac("sha256", secret)
      .update(`${new Date().toISOString().slice(0, 10)}:${ip}`)
      .digest("hex");
    return json({ comment: await createComment(input, actor) }, 201);
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  const authError = await adminApiError(request);
  if (authError) return authError;
  const postId = Number(request.nextUrl.searchParams.get("postId"));
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!Number.isSafeInteger(postId) || postId <= 0 || !uuidPattern.test(id))
    return json({ error: "댓글을 확인해주세요." }, 400);
  try {
    await removeComment(postId, id);
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
