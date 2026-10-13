import type { BlogPost, PageStyle, Paper } from "@/types/post";
import { normalizeCoverLayout } from "@/lib/cover";
import { normalizeYoutubeUrl } from "@/lib/youtube";

export const papers: { id: Paper; name: string; description: string }[] = [
  { id: "cotton", name: "코튼", description: "포근한 결의 미색 종이" },
  { id: "fleck", name: "내추럴", description: "작은 점이 살아 있는 자연지" },
  { id: "white", name: "백지", description: "차분하고 깨끗한 흰 종이" },
  { id: "vintage", name: "빈티지", description: "시간이 묻어나는 빛바랜 종이" },
];

export const defaultPageStyle: PageStyle = {
  layout: "prose",
  font: "serif",
  align: "left",
  fontSize: 17,
  lineHeight: 1.95,
  margin: "normal",
};

export function normalizePageStyle(value: unknown): PageStyle {
  const v = (
    value && typeof value === "object" ? value : {}
  ) as Partial<PageStyle>;
  return {
    layout: v.layout === "title" || v.layout === "quote" ? v.layout : "prose",
    font: v.font === "sans" ? "sans" : "serif",
    align: v.align === "center" || v.align === "justify" ? v.align : "left",
    fontSize:
      typeof v.fontSize === "number" && Number.isFinite(v.fontSize)
        ? Math.max(14, Math.min(24, v.fontSize))
        : 17,
    lineHeight:
      typeof v.lineHeight === "number" && Number.isFinite(v.lineHeight)
        ? Math.max(1.5, Math.min(2.4, v.lineHeight))
        : 1.95,
    margin: v.margin === "compact" || v.margin === "wide" ? v.margin : "normal",
  };
}

export function isPaper(value: unknown): value is Paper {
  return papers.some((paper) => paper.id === value);
}

// A repeatable assignment keeps older Markdown posts stable across SSR and navigation.
export function paperForPost(
  post: Pick<BlogPost, "id" | "title" | "paper">,
): Paper {
  if (isPaper(post.paper)) return post.paper;
  const hash = Array.from(`${post.id}:${post.title}`).reduce(
    (value, char) => (Math.imul(value, 31) + char.charCodeAt(0)) | 0,
    7,
  );
  return papers[(hash >>> 0) % papers.length].id;
}

export function randomPaper(current?: Paper): Paper {
  const choices = papers.filter((paper) => paper.id !== current);
  return choices[Math.floor(Math.random() * choices.length)].id;
}

export function excerptOf(content: string): string {
  return content
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function pageTitle(content: string, index: number): string {
  return (
    content
      .split("\n")
      .find((line) => line.trim())
      ?.replace(/^#+\s*/, "")
      .slice(0, 45) || `${index + 1}쪽`
  );
}

export function formatDate(date: string): string {
  return date.replaceAll("-", ". ");
}

// JSON is a YAML subset: quoting every text field also preserves punctuation and newlines.
export function serializePost(post: BlogPost): string {
  const coverLayout = normalizeCoverLayout(post.coverLayout);
  const youtubeUrl = normalizeYoutubeUrl(post.youtubeUrl);
  const metadata = {
    id: post.id,
    title: post.title,
    date: post.date,
    author: post.author,
    description: post.description || "",
    tags: Array.from(
      new Set(post.tags?.map((tag) => tag.trim()).filter(Boolean)),
    ),
    paper: paperForPost(post),
    ...(post.thumbnail ? { thumbnail: post.thumbnail } : {}),
    ...(youtubeUrl ? { youtubeUrl } : {}),
    ...(coverLayout ? { coverLayout } : {}),
    pageStyles: post.pages.map((page) => normalizePageStyle(page.style)),
  };
  const header = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  return `---\n${header}\n---\n\n${post.pages.map((page) => page.content.trim()).join("\n\n---page---\n\n")}\n`;
}
