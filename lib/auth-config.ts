type AuthEnvironment = Record<string, string | undefined>;

// Report field names and corrective guidance only, never credential values.
export function authConfiguration(env: AuthEnvironment) {
  const issues: string[] = [];
  let origin: string | undefined;
  try {
    const url = new URL(env.NEXTAUTH_URL || "");
    if (
      !(url.protocol === "https:" ||
        (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) ||
      url.pathname !== "/" || url.search || url.hash || url.username || url.password
    ) throw new Error("Invalid site URL");
    origin = url.origin;
  } catch {
    issues.push("NEXTAUTH_URL: 블로그의 전체 주소를 입력해주세요. 로컬에서는 http://127.0.0.1:3000처럼 포트까지 일치해야 합니다.");
  }
  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET.length < 32)
    issues.push("NEXTAUTH_SECRET: 32자 이상의 무작위 세션 비밀키가 필요합니다.");
  if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(env.ADMIN_USERNAME || ""))
    issues.push("ADMIN_USERNAME: 영문·숫자·밑줄·점·하이픈으로 3~64자의 아이디를 설정해주세요.");
  if (!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH || ""))
    issues.push("ADMIN_PASSWORD_HASH: npm run admin:setup으로 비밀번호를 설정해주세요.");
  return { configured: issues.length === 0, origin, issues };
}

export function authErrorMessage(code: unknown): string {
  if (!code) return "";
  switch (code) {
    case "AccessDenied":
    case "CredentialsSignin":
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    case "TooManyAttempts":
      return "로그인 시도가 너무 많습니다. 1분 뒤 다시 시도해주세요.";
    case "Configuration":
      return "서버의 로그인 설정을 확인해주세요. 환경변수를 변경했다면 서버 재시작 또는 재배포가 필요합니다.";
    case "SessionRequired":
      return "로그인 시간이 만료되었습니다. 다시 로그인해주세요.";
    default:
      return "로그인을 완료하지 못했습니다. 이 화면에서 다시 시도해주세요.";
  }
}
