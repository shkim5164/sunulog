# Sunulog 관리자 로그인 설정

관리자 한 명의 아이디·비밀번호로 로그인합니다. GitHub OAuth App이나 데이터베이스는 필요하지 않습니다. 비밀번호는 scrypt 해시로만 저장하며 세션은 NextAuth의 암호화된 HttpOnly 쿠키로 유지합니다.

## 로컬 계정 만들기

프로젝트 폴더의 터미널에서 실행하세요.

```bash
npm run admin:setup
```

아이디와 비밀번호를 두 번 입력합니다. 비밀번호는 입력 중 표시되지 않으며 12자 이상이어야 합니다. 스크립트는 `.env.local`에 아이디·비밀번호 해시를 저장하고, 없는 경우 세션 비밀키와 로컬 주소도 생성합니다. 기존의 다른 환경변수는 보존합니다. `.env.local`은 Git에서 제외되어 있습니다. 비밀번호 원문은 파일이나 로그에 저장하지 않습니다.

개발 서버를 재시작한 뒤 `http://127.0.0.1:3000/login`에서 로그인하세요. 다른 포트를 쓰면 `.env.local`의 `NEXTAUTH_URL`도 수정하세요.

## Vercel 배포

프로젝트의 Settings → Environment Variables에 다음 네 값을 등록하고 재배포하세요. 비밀값을 채팅이나 Git에 올리지 마세요.

| 이름 | 값 |
| --- | --- |
| `NEXTAUTH_URL` | 실제 운영 도메인. 예: `https://your-blog.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`로 생성한 운영용 비밀키 |
| `ADMIN_USERNAME` | `.env.local`에 설정한 아이디 |
| `ADMIN_PASSWORD_HASH` | `.env.local`의 `scrypt:`로 시작하는 해시 전체 |

운영에서는 HTTPS가 필요합니다. `GITHUB_ID`, `GITHUB_SECRET`, `ADMIN_GITHUB_ID`는 더 이상 사용하지 않습니다. 기존 GitHub 세션은 관리자 권한을 얻지 못합니다.

## 비밀번호 변경·분실

`npm run admin:setup`을 다시 실행해 새 비밀번호를 설정하세요. 운영에서는 새 `ADMIN_PASSWORD_HASH`를 등록하고 재배포합니다. 아이디나 해시를 변경하면 기존 세션은 다음 서버 검증에서 거부됩니다. `NEXTAUTH_SECRET` 교체도 기존 세션을 모두 무효화합니다. 공개 회원가입이나 비밀번호 재설정 API는 없습니다.

## 동작과 제한

- 비로그인 상태의 `/admin`, `/write`, `/settings` 및 저장 API 접근은 차단합니다.
- 올바른 계정으로 로그인하면 원래 요청한 관리자 화면으로 돌아갑니다.
- 잘못된 아이디와 비밀번호는 동일한 오류 문구로 안내합니다.
- 비밀번호 검증은 **서버 인스턴스당 1분에 5회**로 제한합니다. 모든 요청이 한 예산을 공유하므로 IP나 아이디를 바꿔도 해당 인스턴스의 제한을 우회할 수 없습니다. 이 메모리 제한은 서버 재시작 시 초기화되고 여러 인스턴스 간 공유되지 않습니다. 공개 운영 배포에서는 Vercel Firewall 등에서 `POST /api/auth/callback/credentials`에 공통 요청 제한도 설정하세요.
- 세션은 8시간이며 활동 시 갱신됩니다. 쿠키·CSRF 보호는 NextAuth가 처리합니다.
- 설정이 빠지면 로그인과 관리자 접근을 차단합니다. 로컬 로그인 화면에는 누락된 설정 이름이 표시됩니다.
- 로그인 화면은 `NEXTAUTH_URL` 호스트로 맞춰 쿠키와 저장 API 출처가 일치하도록 합니다.

## 글 저장은 별도 작업

로그인만으로 Vercel에서 글이 영구 저장되지는 않습니다. 현재 글·사진·설정 저장 API는 localhost 개발 모드에서만 작동합니다. 운영에서는 Markdown 내려받기를 사용하며 온라인 발행에는 영구 저장소 연결이 필요합니다.

## 참고

- [NextAuth Credentials provider](https://next-auth.js.org/providers/credentials)
- [NextAuth 환경변수와 세션](https://next-auth.js.org/configuration/options)
