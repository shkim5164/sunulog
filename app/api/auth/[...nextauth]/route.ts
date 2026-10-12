import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions, isAuthConfigured } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handleAuth = NextAuth(authOptions);
async function handler(
  request: NextRequest,
  context: { params: { nextauth: string[] } },
) {
  if (!isAuthConfigured()) {
    if (
      request.method === "GET" &&
      context.params.nextauth.join("/") === "session"
    )
      return NextResponse.json(null, {
        headers: { "Cache-Control": "no-store" },
      });
    return NextResponse.json(
      { error: "관리자 로그인 설정이 아직 완료되지 않았습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return handleAuth(request, context);
}
export { handler as GET, handler as POST };
