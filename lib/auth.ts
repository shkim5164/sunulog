import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { adminReturnPath, isAdminAccount, sameOrigin } from "@/lib/auth-policy";

export function isAuthConfigured() {
  try {
    const url = new URL(process.env.NEXTAUTH_URL || "");
    const allowedProtocol =
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    return Boolean(
      allowedProtocol &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        !url.username &&
        !url.password &&
        process.env.NEXTAUTH_SECRET &&
        process.env.NEXTAUTH_SECRET.length >= 32 &&
        process.env.GITHUB_ID &&
        process.env.GITHUB_SECRET &&
        /^[1-9]\d*$/.test(process.env.ADMIN_GITHUB_ID || ""),
    );
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account }) {
      return (
        isAuthConfigured() &&
        isAdminAccount(account, process.env.ADMIN_GITHUB_ID)
      );
    },
    async jwt({ token, account }) {
      // Client session updates cannot supply an identity or grant a role.
      if (account)
        token.githubId =
          account.provider === "github" ? account.providerAccountId : undefined;
      return token;
    },
    async session({ session, token }) {
      session.isAdmin =
        isAuthConfigured() &&
        isAdminAccount(
          { provider: "github", providerAccountId: token.githubId },
          process.env.ADMIN_GITHUB_ID,
        );
      if (session.user)
        session.user.id = session.isAdmin ? token.githubId : undefined;
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
  return session?.isAdmin && session.user?.id === process.env.ADMIN_GITHUB_ID
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
