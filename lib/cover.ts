import type {
  BlogPost,
  CoverElement,
  CoverField,
  CoverLayout,
  CoverTextElement,
} from "@/types/post";
import { imageSource } from "@/lib/media";

export const coverFields: CoverField[] = [
  "category",
  "title",
  "description",
  "author",
  "date",
];
export const coverLabels: Record<CoverField, string> = {
  category: "카테고리",
  title: "제목",
  description: "소개",
  author: "작가",
  date: "날짜",
};

export function defaultCoverLayout(): CoverLayout {
  const settings = [
    [10, 28, 80, 6, 14],
    [8, 37, 84, 16, 52],
    [14, 56, 72, 15, 16],
    [12, 84, 76, 5, 20],
    [12, 92, 76, 4, 13],
  ];
  return {
    version: 1,
    elements: coverFields.map(
      (field, i): CoverTextElement => ({
        id: `text-${field}`,
        kind: "text",
        field,
        x: settings[i][0],
        y: settings[i][1],
        width: settings[i][2],
        height: settings[i][3],
        fontSize: settings[i][4],
        font: field === "category" || field === "date" ? "sans" : "serif",
        align: "center",
        hidden: false,
      }),
    ),
  };
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const bound = (value: unknown, fallback: number, min: number, max: number) =>
  Math.round(
    Math.max(
      min,
      Math.min(
        max,
        typeof value === "number" && Number.isFinite(value) ? value : fallback,
      ),
    ) * 10,
  ) / 10;

export function isCoverLayoutInput(value: unknown): boolean {
  const v = record(value);
  return (
    v.version === 1 &&
    Array.isArray(v.elements) &&
    v.elements.length <= 11 &&
    v.elements.every((item) => {
      const e = record(item);
      return e.kind === "text"
        ? coverFields.includes(e.field as CoverField)
        : e.kind === "image" &&
            typeof e.id === "string" &&
            /^image-[\w-]{1,80}$/.test(e.id) &&
            typeof e.src === "string" &&
            (e.src === "" || Boolean(imageSource(e.src)));
    })
  );
}

export function normalizeCoverLayout(
  value: unknown,
  editing = false,
): CoverLayout | undefined {
  const v = record(value);
  if (v.version !== 1 || !Array.isArray(v.elements)) return undefined;
  const defaults = defaultCoverLayout().elements as CoverTextElement[];
  const elements: CoverElement[] = [];
  const seen = new Set<string>();
  let images = 0;
  for (const item of v.elements.slice(0, 40)) {
    const e = record(item);
    const fallback = defaults.find(
      (d) => e.kind === "text" && d.field === e.field,
    );
    const isImage =
      e.kind === "image" &&
      typeof e.id === "string" &&
      /^image-[\w-]{1,80}$/.test(e.id);
    if (!fallback && !isImage) continue;
    if (
      isImage &&
      (images >= 6 ||
        typeof e.src !== "string" ||
        (!editing && e.src !== "" && !imageSource(e.src)))
    )
      continue;
    const id = fallback?.id || String(e.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const width = bound(e.width, fallback?.width || 60, 8, 100);
    const height = bound(e.height, fallback?.height || 30, 3, 100);
    const frame = {
      id,
      width,
      height,
      x: bound(e.x, fallback?.x || 0, 0, 100 - width),
      y: bound(e.y, fallback?.y || 0, 0, 100 - height),
      hidden: e.hidden === true,
    };
    if (fallback)
      elements.push({
        ...frame,
        kind: "text",
        field: fallback.field,
        fontSize: bound(e.fontSize, fallback.fontSize, 12, 96),
        font: e.font === "sans" ? "sans" : "serif",
        align: e.align === "left" || e.align === "right" ? e.align : "center",
      });
    else {
      images++;
      elements.push({
        ...frame,
        kind: "image",
        src: editing ? String(e.src).slice(0, 2048) : imageSource(e.src) || "",
        alt: typeof e.alt === "string" ? e.alt.slice(0, 180) : "",
        fit: e.fit === "contain" ? "contain" : "cover",
      });
    }
  }
  for (const fallback of defaults)
    if (!seen.has(fallback.id)) elements.push(fallback);
  return { version: 1, elements };
}

export function coverText(
  post: BlogPost,
  field: CoverField,
  editing = false,
): string {
  switch (field) {
    case "category":
      return post.tags?.filter((t) => t.trim()).join(" · ") || "이야기";
    case "title":
      return post.title || "제목 없는 이야기";
    case "description":
      return post.description || (editing ? "소개를 입력해주세요" : "");
    case "author":
      return `${post.author || "이름 없는 작가"} 씀`;
    case "date":
      return post.date.replaceAll("-", ". ");
  }
}
