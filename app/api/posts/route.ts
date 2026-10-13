import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { isPaper, normalizePageStyle, serializePost } from "@/lib/book";
import { getAllPosts, getPostFromMarkdown } from "@/lib/posts";
import type { BlogPost } from "@/types/post";
import { imageSource } from "@/lib/media";
import { isCoverLayoutInput, normalizeCoverLayout } from "@/lib/cover";
import { adminApiError } from "@/lib/auth";
import { normalizeYoutubeUrl } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = await adminApiError(request);
  if (authError) return authError;
  // This file-based editor is only available on the author's local dev server.
  // An authenticated deployment still needs persistent storage before enabling writes.
  if (process.env.NODE_ENV !== "development")
    return NextResponse.json(
      {
        error:
          "배포된 사이트에서는 파일을 저장할 수 없어요. Markdown을 내려받아 프로젝트에 추가해주세요.",
      },
      { status: 403 },
    );
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const allowedHosts = ["localhost", "127.0.0.1", "[::1]"];
  let originUrl: URL;
  try {
    originUrl = new URL(origin || "");
  } catch {
    return NextResponse.json(
      { error: "올바른 요청 출처가 필요합니다." },
      { status: 403 },
    );
  }
  if (
    !allowedHosts.includes(originUrl.hostname) ||
    originUrl.host !== host ||
    !request.headers.get("content-type")?.includes("application/json")
  )
    return NextResponse.json(
      { error: "로컬 작성 화면에서 다시 저장해주세요." },
      { status: 403 },
    );
  try {
    // Bound the stream before parsing, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json(
        { error: "글 내용이 없습니다." },
        { status: 400 },
      );
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1_000_000) {
        await reader.cancel();
        return NextResponse.json(
          { error: "글이 너무 큽니다. 1MB 이하로 나누어 저장해주세요." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const { post: input, update } = JSON.parse(
      Buffer.concat(chunks).toString("utf8"),
    );
    if (input?.thumbnail && !imageSource(input.thumbnail)) {
      return NextResponse.json(
        { error: "대표 이미지 주소를 확인해주세요." },
        { status: 400 },
      );
    }
    if (input?.youtubeUrl !== undefined &&
        (typeof input.youtubeUrl !== "string" ||
          (input.youtubeUrl.trim() && !normalizeYoutubeUrl(input.youtubeUrl)))) {
      return NextResponse.json(
        { error: "배경음악 YouTube 영상 링크를 확인해주세요." },
        { status: 400 },
      );
    }
    if (
      input?.coverLayout !== undefined &&
      !isCoverLayoutInput(input.coverLayout)
    ) {
      return NextResponse.json(
        { error: "표지 구성과 이미지 주소를 확인해주세요." },
        { status: 400 },
      );
    }
    if (
      !input ||
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.length > 180 ||
      typeof input.author !== "string" ||
      !input.author.trim() ||
      input.author.length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
      !isPaper(input.paper) ||
      !Array.isArray(input.pages) ||
      !input.pages.length ||
      input.pages.length > 100 ||
      !input.pages.every(
        (p: { content?: unknown }) =>
          typeof p?.content === "string" &&
          p.content.trim() &&
          !/^---page---\s*$/m.test(p.content),
      ) ||
      !Number.isSafeInteger(input.id) ||
      input.id <= 0 ||
      (input.tags !== undefined &&
        (!Array.isArray(input.tags) ||
          input.tags.some(
            (tag: unknown) => typeof tag !== "string" || tag.length > 40,
          )))
    ) {
      return NextResponse.json(
        {
          error:
            "제목, 작가, 날짜와 각 페이지의 내용을 확인해주세요. 페이지는 ‘페이지 추가’로 나눠주세요.",
        },
        { status: 400 },
      );
    }
    const post: BlogPost = {
      id: input.id,
      title: input.title.trim(),
      author: input.author.trim(),
      date: input.date,
      description:
        typeof input.description === "string"
          ? input.description.slice(0, 500)
          : "",
      tags: Array.from(
        new Set<string>(
          (input.tags || []).map((tag: string) => tag.trim()).filter(Boolean),
        ),
      ),
      paper: input.paper,
      youtubeUrl: normalizeYoutubeUrl(input.youtubeUrl),
      coverLayout: normalizeCoverLayout(input.coverLayout),
      ...(typeof input.thumbnail === "string"
        ? { thumbnail: input.thumbnail }
        : {}),
      pages: input.pages.map(
        (p: { content: string; style?: unknown }, i: number) => ({
          pageNumber: i + 1,
          content: p.content,
          style: normalizePageStyle(p.style),
        }),
      ),
    };
    const directory = path.join(process.cwd(), "posts");
    await fs.mkdir(directory, { recursive: true });
    let filename = `${post.date}-${post.id}.md`;
    const allPosts = getAllPosts();
    if (update) {
      const filenames = await fs.readdir(directory);
      const existing = filenames
        .filter((name) => name.endsWith(".md"))
        .find((name) => getPostFromMarkdown(name).id === post.id);
      if (!existing)
        return NextResponse.json(
          {
            error: "원본 글을 찾지 못했어요. Markdown을 내려받아 보관해주세요.",
          },
          { status: 404 },
        );
      filename = existing;
      // Preserve unknown existing metadata while updating the book's editable fields.
      const source = matter(
        await fs.readFile(path.join(directory, filename), "utf8"),
      );
      const updated = matter(serializePost(post));
      const metadata = {
        ...source.data,
        ...updated.data,
      };
      if (!post.thumbnail) delete metadata.thumbnail;
      if (!post.youtubeUrl) delete metadata.youtubeUrl;
      if (!post.coverLayout) delete metadata.coverLayout;
      const serialized = matter.stringify(updated.content, metadata);
      const temporary = path.join(
        directory,
        `.${post.id}-${crypto.randomUUID()}.tmp`,
      );
      await fs.writeFile(temporary, serialized, "utf8");
      await fs.rename(temporary, path.join(directory, filename));
    } else {
      if (allPosts.some((existing) => existing.id === post.id))
        return NextResponse.json(
          {
            error:
              "같은 식별자의 글이 이미 있어요. 새 초안에서 다시 등록해주세요.",
          },
          { status: 409 },
        );
      await fs.writeFile(path.join(directory, filename), serializePost(post), {
        encoding: "utf8",
        flag: "wx",
      });
    }
    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/post/${post.id}`);
    return NextResponse.json({ id: post.id });
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json(
        {
          error:
            "글 형식을 읽지 못했어요. 작성 화면을 새로 열어 다시 시도해주세요.",
        },
        { status: 400 },
      );
    console.error("Could not save the book post", error);
    return NextResponse.json(
      {
        error:
          "파일을 저장하지 못했어요. 다시 시도하거나 Markdown을 내려받아주세요.",
      },
      { status: 500 },
    );
  }
}
