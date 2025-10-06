# 📚 나만의 블로그

전자책처럼 페이지를 넘기며 읽는 블로그입니다.

## ✨ 특징

- 🏠 **모던한 메인 페이지** - 히어로 섹션과 카드형 포스트 레이아웃
- 🧭 **네비게이션 바** - 모든 페이지에서 접근 가능
- 📖 **실제 책처럼 두 페이지씩 보이는 레이아웃**
- 🔄 **3D 책장 넘김 애니메이션** - 실제 책장을 넘기는 듯한 효과
- ⌨️ **키보드 방향키로 페이지 전환**
- 📝 **Markdown으로 글 작성** - 쉽고 빠른 포스팅
- 🖼️ **이미지 및 썸네일 지원**
- 🎨 **아름다운 그라디언트 배경과 종이 질감**
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
- **폰트**: Georgia (세리프 폰트)

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

`app/globals.css`에서 CSS 변수 수정:

```css
:root {
  --page-bg: #f5f1e8; /* 페이지 배경색 */
  --text-color: #2d2d2d; /* 텍스트 색상 */
  --shadow-color: rgba(0, 0, 0, 0.1); /* 그림자 */
}
```

### 배경 그라디언트

`app/globals.css`의 `body` 스타일 수정.

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
