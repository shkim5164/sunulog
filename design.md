# Sunulog — Paper library

이 블로그의 공통 디자인 시스템. 사용자가 선택한 네 장의 종이 사진과 고운바탕을 중심으로 구성한다.

- Genre: editorial; 색감은 따뜻한 미색, 잉크색, 작은 적갈색 강조.
- Home: Photographic. 넓은 책·창가 사진 한 장과 짧은 소개 한 문장. `/settings`에서 사진 업로드·주소·자르기 위치·소개를 변경한다.
- Archive: Catalogue. 대표 사진 위, 제목 아래의 카드. 검색·태그·정렬은 목록 도구로 유지한다. 글 본문은 기존 책 형태를 유지한다.
- Reader: Long Document. 최대 1480px의 넓은 책. 데스크톱 두 쪽, 768px 미만 한 쪽. 첫 장은 카테고리·제목·소개·작가·날짜를 담은 표지이며, 본문은 다음 쪽부터 시작한다. 내부 스크롤 없이 긴 원고는 화면에 맞춰 추가 책장으로 흐른다. 읽기 쪽 번호와 목차는 재계산하고 원고의 구분과 서식은 유지한다. 표지는 필요할 때 축소하고 추천 사진은 남은 높이에 맞춘다.
- Reader ending: 마지막 장에는 현재 글을 제외한 최신 글 최대 2편을 대표 이미지와 제목 카드로 보여준다. 모바일에도 독립된 마지막 장을 제공하고, 목차와 전체 글 목록 링크로 연결한다.
- Reader comments: 본문 선택 시 오른쪽 여백에 익명 댓글 창을 연다. 모바일은 하단 창을 사용한다. 4가지 연한 강조색과 겹친 구간의 색 분할, 인용문으로 이동, 익명 답글을 지원한다. 댓글 창만 스크롤하며 책의 페이지 넘김은 유지한다.
- Editor: Workbench. 페이지 목록, Markdown 원고와 서식, 동일한 렌더러의 실시간 미리보기.
- Cover editor: 3:4 캔버스에서 글 정보 5개와 이미지 최대 6장을 배치한다. 위치·영역은 비율로 저장하고, 텍스트는 영역에 맞춰 축소한다. 편집기와 독자는 `CoverCanvas`를 공유한다. 드래그·키보드·수치 입력, 실행 취소, 표시 여부와 앞뒤 순서를 지원한다.
- Display and prose: Gowun Batang 400 / 700, 로컬 WOFF2. 제목은 정체.
- Controls: 운영체제 한글 고딕. 코드만 시스템 고정폭.
- Tokens: `tokens.css`의 색상·타이포그래피·간격·이징이 공통 기준이다.
- Motion: 다음 장은 오른쪽에서 왼쪽으로, 이전 장은 왼쪽에서 오른쪽으로 넘긴다. 데스크톱에서는 책등을 축으로 회전하고, 모바일에서는 같은 방향으로 이동한다. reduced-motion에서는 120ms 투명도 전환.
- CTA: 작은 직사각형 또는 밑줄 텍스트. 동작을 설명하는 한국어.
- Focus: 적갈색 2px outline. 즉시 표시, hover와 별개로 유지.
- 배경: 기존 글은 ID와 제목으로 안정적으로 선택. 새 글은 무작위 선택 후 frontmatter에 보존.
- 원문과 기존 `/post/[id]` 주소를 보존. 서버 파일 저장은 로컬 개발 환경에서만 허용.

## Exports

프로젝트는 Tailwind 3을 사용하며 `tokens.css`를 실제 소스로 가져온다. 아래 포맷은 다른 프로젝트로 옮길 때의 대응표다.

### CSS source

`tokens.css` — 전체 색상, 서체, 간격, 크기, 이징, 지속 시간과 반경 토큰.

### Tailwind v4

```css
@theme {
  --color-paper: oklch(96.7% 0.012 85);
  --color-paper-2: oklch(93.2% 0.015 85);
  --color-ink: oklch(28% 0.017 65);
  --color-accent: oklch(44% 0.088 38);
  --font-display: "Gowun Batang", "AppleMyungjo", serif;
  --font-body: -apple-system, "Apple SD Gothic Neo", sans-serif;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --text-display: clamp(30px, 3.7vw, 50px);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG

```json
{
  "color": {
    "paper": { "$value": "oklch(96.7% 0.012 85)", "$type": "color" },
    "ink": { "$value": "oklch(28% 0.017 65)", "$type": "color" },
    "accent": { "$value": "oklch(44% 0.088 38)", "$type": "color" }
  },
  "font": { "display": { "$value": "Gowun Batang", "$type": "fontFamily" } },
  "space": { "md": { "$value": "16px", "$type": "dimension" } }
}
```

### shadcn/ui variables (OKLCH)

```css
:root {
  --background: oklch(96.7% 0.012 85);
  --foreground: oklch(28% 0.017 65);
  --primary: oklch(44% 0.088 38);
  --primary-foreground: oklch(98% 0.01 85);
  --muted: oklch(93.2% 0.015 85);
  --muted-foreground: oklch(49% 0.02 65);
  --border: oklch(81% 0.019 75);
  --input: oklch(81% 0.019 75);
  --ring: oklch(43% 0.11 38);
  --radius: 3px;
}
```
