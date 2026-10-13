import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdminSession } from "@/lib/auth";
import { authConfiguration, authErrorMessage } from "@/lib/auth-config";
import { adminReturnPath } from "@/lib/auth-policy";
import AdminLoginForm from "@/components/AdminLoginForm";

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
  const { configured, origin, issues } = authConfiguration(process.env);
  // Start login on the canonical host so session cookies and write origins agree.
  if (configured && origin && headers().get("host") !== new URL(origin).host) {
    const canonical = new URL("/login", origin);
    canonical.searchParams.set("callbackUrl", returnTo);
    if (searchParams.error) canonical.searchParams.set("error", searchParams.error);
    redirect(canonical.toString());
  }
  if (await getAdminSession()) redirect(returnTo);
  const error = authErrorMessage(searchParams.error);
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
          <div className="auth-notice" role="status">
            <p>관리자 로그인 설정이 아직 완료되지 않았습니다.</p>
            {process.env.NODE_ENV === "development" && (
              <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
            )}
            <p>서버의 인증 환경변수를 확인하고 다시 배포해주세요.</p>
          </div>
        )}
        <AdminLoginForm callbackUrl={returnTo} disabled={!configured} />
        <Link href="/" className="text-link">
          서재로 돌아가기
        </Link>
      </section>
    </main>
  );
}
