# 📚 Sunulog

전자책처럼 페이지를 넘기며 읽는 블로그입니다.

## ✨ 특징

- 🏠 **사진으로 시작하는 서재** - 넓은 창가 사진과 소개 한 줄, 대표 이미지와 제목으로 보는 이야기 카드
- 🧭 **네비게이션 바** - 모든 페이지에서 접근 가능
- 📖 **실제 책처럼 두 페이지씩 보이는 레이아웃**
- 🔄 **3D 책장 넘김 애니메이션** - 실제 책장을 넘기는 듯한 효과
- ⌨️ **키보드 방향키로 페이지 전환**
- 📝 **Markdown으로 글 작성** - 쉽고 빠른 포스팅
- 🖼️ **이미지 및 썸네일 지원**
- ⚙️ **메인 화면 설정** - `/settings`에서 사진 업로드, 소개 문장과 사진 위치 변경
- 🎨 **글마다 고르는 네 가지 종이 질감** - 무작위 선택 후 글에 저장
- ✍️ **페이지별 편집 화면** - 서체, 정렬, 여백, 줄 간격, 페이지 순서와 실시간 미리보기
- 📐 **표지 자유 편집** - 글 정보와 이미지를 드래그 배치하고 크기·정렬·앞뒤 순서 조절, 실행 취소 지원
- 💾 **초안 자동 저장과 Markdown 내려받기** - 로컬 개발 서버에서 실제 글 등록·수정
- 🔐 **관리자 로그인** - 지정한 아이디·비밀번호로만 작업실·글쓰기·설정 및 저장 API에 접근
- 💬 **문장 댓글** - 본문 선택, 여러 색의 강조, 익명 댓글·답글. 배포 연결은 [COMMENTS_SETUP.md](COMMENTS_SETUP.md) 참고
- 📱 **완벽한 반응형 디자인**

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어주세요.

## 📝 블로그 글 작성하기

먼저 [관리자 로그인 설정](ADMIN_SETUP.md)에 따라 아이디·비밀번호와 환경변수를 설정하세요. 상단 **관리자**에서 로그인한 뒤 **작업실 → 새 이야기 쓰기**(`/write`)에서 책처럼 편집할 수 있습니다. 로컬 개발 서버에서는 **글 등록**으로 Markdown 파일을 저장합니다. 배포 환경에서는 Markdown을 내려받아 `posts/`에 추가 후 재배포하세요. 온라인 발행에는 영구 저장소 연결이 추가로 필요합니다. 자세한 기능과 저장 형식은 `HOW_TO_WRITE.md`의 **책 편집 화면 사용하기**를 참고하세요.

### 1. 새 글 만들기

`posts/` 폴더에 새 Markdown 파일을 생성하세요:

```
posts/2025-10-06-my-story.md
```

### 2. 글 작성

```markdown
---
title: "내 이야기"
date: "2025-10-06"
author: "작가"
---

---page---

# 첫 번째 페이지

여기에 내용을 작성합니다.

---page---

# 두 번째 페이지

페이지를 계속 추가할 수 있습니다.
```

### 3. 이미지 추가

1. `public/posts/images/` 폴더에 이미지 저장
2. Markdown에서 사용:

```markdown
![설명](/posts/images/photo.jpg)
```

### 📖 자세한 작성 가이드

`HOW_TO_WRITE.md` 파일을 참고하세요!

## 🎮 사용법

- **마우스**: 이전/다음 버튼 클릭
- **키보드**: ← → 방향키로 페이지 전환
- **인디케이터**: 하단 점들을 클릭하여 원하는 페이지로 이동

## 🛠 기술 스택

- **프레임워크**: Next.js 14
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **Markdown**: react-markdown, gray-matter
- **폰트**: 고운바탕 Regular / Bold (로컬 WOFF2, SIL OFL 1.1)

## 📁 프로젝트 구조

```
blog/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈페이지 (포스트 목록)
│   ├── globals.css         # 글로벌 스타일
│   └── post/[id]/
│       └── page.tsx        # 포스트 페이지
├── components/
│   └── BookReader.tsx      # 전자책 리더 컴포넌트
├── lib/
│   └── posts.ts            # Markdown 파일 읽기
├── posts/                  # 📝 여기에 글 작성!
│   ├── 2025-10-01-first-story.md
│   ├── 2025-10-03-second-story.md
│   └── 2025-10-05-third-story.md
├── public/
│   └── posts/
│       └── images/         # 🖼️ 여기에 이미지 저장!
└── types/
    └── post.ts             # TypeScript 타입
```

## 📝 Markdown 문법

### 제목

```markdown
# H1 제목

## H2 제목

### H3 제목
```

### 텍스트 스타일

```markdown
**굵게**
_기울임_
```

### 이미지

```markdown
![이미지 설명](/posts/images/photo.jpg)
```

### 인용구

```markdown
> 인용구 내용
```

### 목록

```markdown
- 항목 1
- 항목 2

1. 첫 번째
2. 두 번째
```

## 🎨 커스터마이징

### 색상 변경

`tokens.css`에서 공통 CSS 변수 수정:

```css
:root {
  --color-paper: oklch(96.7% 0.012 85);
  --color-ink: oklch(28% 0.017 65);
  --color-accent: oklch(44% 0.088 38);
}
```

### 종이와 서체

종이는 `public/textures/`, 글꼴과 라이선스는 `public/fonts/`에 있습니다. 책 화면의 스타일은 `app/book.css`에서 관리합니다.

## 🔧 빌드

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 정적 사이트 생성

```bash
npm run build
```

빌드된 파일은 `.next/` 폴더에 생성됩니다.

## 💡 팁

### 페이지 구성

- 페이지는 2개씩 보이므로 짝수로 만드는 것이 좋습니다
- 각 페이지는 3-5 문단 정도가 적당
- `---page---`로 페이지 구분

### 이미지 최적화

- 1200px 정도 크기로 리사이즈
- JPG 또는 PNG 형식
- 1MB 이하 권장

### 파일명 규칙

```
YYYY-MM-DD-제목.md
예: 2025-10-06-my-new-story.md
```

## 📄 라이선스

MIT License

---

즐거운 블로깅 되세요! 📚✨
