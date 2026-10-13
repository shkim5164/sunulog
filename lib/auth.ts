import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { adminReturnPath, sameOrigin } from "@/lib/auth-policy";
import { authConfiguration } from "@/lib/auth-config";
import { credentialVersion, verifyCredentials, takeLoginAttempt } from "@/lib/admin-credentials";

export function isAuthConfigured() {
  return authConfiguration(process.env).configured;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "관리자 계정",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!isAuthConfigured()) return null;
        if (!takeLoginAttempt()) throw new Error("TooManyAttempts");
        const version = credentialVersion(process.env);
        if (!(await verifyCredentials(credentials, process.env))) return null;
        return { id: "admin", name: process.env.ADMIN_USERNAME, credentialVersion: version };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user, account }) {
      // Only a server-authorized password login can create an administrator token.
      if (account) {
        token.adminVersion = account.provider === "credentials" && user?.id === "admin"
          ? user.credentialVersion : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.isAdmin = isAuthConfigured() &&
        typeof token.adminVersion === "string" &&
        token.adminVersion === credentialVersion(process.env);
      if (session.user) session.user.id = session.isAdmin ? "admin" : undefined;
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const destination = new URL(url, baseUrl);
        if (destination.origin === new URL(baseUrl).origin) {
          return `${baseUrl}${destination.pathname === "/" ? "/" : adminReturnPath(destination.pathname + destination.search)}`;
        }
      } catch {
        /* Fall back to the protected dashboard. */
      }
      return `${baseUrl}/admin`;
    },
  },
  logger: {
    error(code) {
      console.error("Authentication error:", code);
    },
  },
};

export async function getAdminSession() {
  if (!isAuthConfigured()) return null;
  const session = await getServerSession(authOptions);
  return session?.isAdmin && session.user?.id === "admin"
    ? session
    : null;
}

export async function requireAdminPage(returnTo: string) {
  const session = await getAdminSession();
  if (!session)
    redirect(
      `/login?callbackUrl=${encodeURIComponent(adminReturnPath(returnTo))}`,
    );
  return session;
}

export async function adminApiError(request: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json(
      {
        error:
          "관리자 로그인이 필요합니다. 초안을 보관한 뒤 다시 로그인해주세요.",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  if (!sameOrigin(request.headers.get("origin"), process.env.NEXTAUTH_URL))
    return NextResponse.json(
      { error: "블로그의 관리자 화면에서 다시 요청해주세요." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  return null;
}
