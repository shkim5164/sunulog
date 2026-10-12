import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { isLocalWrite, limitedBody } from "@/lib/local-api";
import { imageSource } from "@/lib/media";
import { adminApiError } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const authError = await adminApiError(request);
  if (authError) return authError;
  if (!isLocalWrite(request))
    return NextResponse.json(
      { error: "메인 화면 설정은 로컬 개발 서버에서 저장할 수 있어요." },
      { status: 403 },
    );
  try {
    const data = JSON.parse(
      (await limitedBody(request, 16384)).toString("utf8"),
    );
    const heroImage = imageSource(data?.heroImage);
    if (
      !heroImage ||
      typeof data.introduction !== "string" ||
      !data.introduction.trim() ||
      data.introduction.length > 120 ||
      typeof data.heroAlt !== "string" ||
      data.heroAlt.length > 180 ||
      !Number.isFinite(data.imagePosition) ||
      data.imagePosition < 0 ||
      data.imagePosition > 100
    )
      return NextResponse.json(
        { error: "이미지 주소와 120자 이내의 소개 문장을 확인해주세요." },
        { status: 400 },
      );
    const settings = {
      heroImage,
      heroAlt: data.heroAlt.trim(),
      introduction: data.introduction.trim().replace(/\s+/g, " "),
      imagePosition: data.imagePosition,
    };
    const target = path.join(process.cwd(), "data/site.json");
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(
      temporary,
      JSON.stringify(settings, null, 2) + "\n",
      "utf8",
    );
    await fs.rename(temporary, target);
    revalidatePath("/");
    revalidatePath("/settings");
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "설정을 저장하지 못했어요. 입력을 확인하고 다시 시도해주세요." },
      {
        status:
          error instanceof SyntaxError
            ? 400
            : error instanceof RangeError
              ? 413
              : 500,
      },
    );
  }
}
