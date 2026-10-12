import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, isAuthConfigured } from "@/lib/auth";
import { adminReturnPath } from "@/lib/auth-policy";
import AdminAuthButton from "@/components/AdminAuthButton";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const returnTo = adminReturnPath(searchParams.callbackUrl);
  if (await getAdminSession()) redirect(returnTo);
  const configured = isAuthConfigured();
  const error =
    searchParams.error === "AccessDenied"
      ? "관리자로 등록된 GitHub 계정으로 로그인해주세요."
      : searchParams.error
        ? "로그인을 완료하지 못했어요. 다시 시도해주세요."
        : "";
  return (
    <main id="main-content" className="auth-main">
      <section
        className="login-sheet paper-cotton"
        aria-labelledby="login-title"
      >
        <span className="quiet-label">SUNULOG</span>
        <h1 id="login-title">
          다음 이야기를
          <br />
          써볼까요.
        </h1>
        <p>
          관리자 계정으로 로그인하고
          <br />
          당신의 책장을 이어가세요.
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!configured && (
          <p className="auth-notice" role="status">
            관리자 로그인 설정이 아직 완료되지 않았습니다.
          </p>
        )}
        <AdminAuthButton callbackUrl={returnTo} disabled={!configured} />
        <Link href="/" className="text-link">
          서재로 돌아가기
        </Link>
      </section>
    </main>
  );
}
