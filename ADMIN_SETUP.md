# Sunulog 관리자 로그인 설정

GitHub 계정 한 개만 관리자로 허용합니다. `/login`에서 로그인하면 `/admin` 작업실에서 새 글 작성, 기존 글 편집, 메인 화면 설정으로 이동할 수 있습니다. 로그인은 데이터베이스 없이 암호화된 세션 쿠키를 사용합니다.

## 1. 관리자 계정 ID 확인

`ADMIN_GITHUB_ID`에는 GitHub 사용자명이 아닌 **숫자 ID**를 넣습니다. 본인 계정으로 GitHub CLI에 로그인되어 있다면 다음 명령으로 확인할 수 있습니다.

```bash
gh api user --jq .id
```

CLI가 없다면 `https://api.github.com/users/사용자명` 응답의 `id` 값을 확인하세요. 계정 이름을 바꾸어도 같은 관리자를 식별하기 위해 숫자 ID를 사용합니다. 값을 비워 두면 누구도 관리자 권한을 얻지 못합니다.

## 2. GitHub OAuth App 만들기

[GitHub OAuth Apps](https://github.com/settings/developers)에서 새 OAuth App을 만드세요.

- Application name: `Sunulog`
- Homepage URL: 실제 블로그의 HTTPS 주소
- Authorization callback URL: `https://실제-블로그-도메인/api/auth/callback/github`

앱의 **Client ID**와 **Client Secret**을 확보합니다. 저장소 접근 토큰(PAT)은 사용하지 않습니다. 로그인은 프로필과 이메일 읽기 권한만 요청하며 저장소 쓰기 권한을 요청하지 않습니다.

## 3. Vercel 환경변수 설정

프로젝트의 **Settings → Environment Variables**에서 Production 환경에 다음 값을 추가하세요. 비밀값을 채팅이나 Git에 올릴 필요는 없습니다.

| 이름 | 값 |
| --- | --- |
| `NEXTAUTH_URL` | 블로그의 실제 HTTPS 주소. 예: `https://your-blog.vercel.app` |
| `NEXTAUTH_SECRET` | 아래 명령으로 만든 무작위 값 |
| `GITHUB_ID` | OAuth App의 Client ID |
| `GITHUB_SECRET` | OAuth App의 Client Secret |
| `ADMIN_GITHUB_ID` | 허용할 관리자 계정의 숫자 ID |

```bash
openssl rand -base64 32
```

값을 넣은 뒤 **변경한 코드를 배포하거나 재배포**하세요. `NEXTAUTH_URL`과 OAuth callback에 같은 도메인을 사용해야 합니다. 도메인을 변경하면 두 설정을 함께 수정하세요. Preview 환경도 사용하려면 해당 환경의 주소와 callback을 별도로 맞추세요.

## 4. 로컬 개발

`.env.example`을 `.env.local`로 복사하고 위 값들을 채우세요. 로컬용 OAuth App을 따로 만들면 운영 설정과 분리해 테스트할 수 있습니다.

```text
Homepage URL: http://127.0.0.1:3000
Authorization callback URL: http://127.0.0.1:3000/api/auth/callback/github
NEXTAUTH_URL=http://127.0.0.1:3000
```

개발 서버를 다시 실행한 뒤 같은 주소로 접속하세요. `localhost`와 `127.0.0.1`은 쿠키와 출처가 서로 다릅니다. 로컬에서도 로그인을 생략하는 우회 경로는 없습니다.

## 확인할 동작

- 비로그인 상태에서 `/admin`, `/write`, `/settings`에 접근하면 로그인 화면으로 이동합니다.
- 허용된 계정으로 로그인하면 요청했던 화면으로 돌아갑니다.
- 다른 GitHub 계정은 로그인할 수 없습니다.
- 글·사진·설정 저장 API는 로그인과 요청 출처를 서버에서 검사합니다.
- 작업실에서 로그아웃하면 관리자 화면이 다시 잠깁니다.
- 로그인 설정이 빠지면 로그인 버튼은 비활성화되고 관리자 접근은 차단됩니다.

세션 유효기간은 8시간이며 활동 시 갱신됩니다. 관리자 ID를 바꾸면 기존 계정의 권한은 다음 서버 검증에서 거부됩니다. `NEXTAUTH_SECRET`을 교체하고 재배포하면 기존 세션을 모두 무효화할 수 있습니다.

## 글 저장은 별도 작업

**관리자 로그인 연결만으로 Vercel에서 글이 영구 저장되지는 않습니다.** 현재 글·사진·설정은 프로젝트 파일을 사용하는 구조여서 쓰기 API는 관리자 로그인 후에도 localhost 개발 모드에서만 작동합니다. 운영 화면은 초안 편집과 Markdown 내려받기를 지원합니다. 온라인에서 바로 발행하려면 글과 사진을 보관할 영구 저장소를 추가해야 합니다.

## 참고 문서

- [NextAuth.js App Router 및 서버 세션](https://next-auth.js.org/configuration/nextjs)
- [GitHub OAuth App 등록](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Vercel 환경변수](https://vercel.com/docs/environment-variables)
