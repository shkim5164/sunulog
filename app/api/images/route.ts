import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { isLocalWrite, limitedBody } from "@/lib/local-api";
import { adminApiError } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const authError = await adminApiError(request);
  if (authError) return authError;
  if (!isLocalWrite(request))
    return NextResponse.json(
      { error: "사진 업로드는 로컬 개발 서버에서 사용할 수 있어요." },
      { status: 403 },
    );
  try {
    const body = await limitedBody(request, 8 * 1024 * 1024 + 65536);
    const form = await new Response(new Uint8Array(body), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size > 8 * 1024 * 1024)
      return NextResponse.json(
        { error: "8MB 이하의 이미지 파일을 선택해주세요." },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "png"
      : buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        ? "jpg"
        : ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString())
          ? "gif"
          : buffer.subarray(0, 4).toString() === "RIFF" &&
              buffer.subarray(8, 12).toString() === "WEBP"
            ? "webp"
            : null;
    if (!extension)
      return NextResponse.json(
        { error: "JPG, PNG, WebP, GIF 사진만 업로드할 수 있어요." },
        { status: 400 },
      );
    const directory = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(directory, { recursive: true });
    const filename = `${crypto.randomUUID()}.${extension}`;
    await fs.writeFile(path.join(directory, filename), buffer, { flag: "wx" });
    return NextResponse.json({ src: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RangeError
            ? "사진이 너무 커요. 8MB 이하로 골라주세요."
            : "사진을 업로드하지 못했어요. 파일을 확인하고 다시 시도해주세요.",
      },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
}
