export interface PostPage {
  pageNumber: number;
  content: string;
  style?: PageStyle;
}

export type Paper = "cotton" | "fleck" | "white" | "vintage";

export interface PageStyle {
  layout: "prose" | "title" | "quote";
  font: "serif" | "sans";
  align: "left" | "center" | "justify";
  fontSize: number;
  lineHeight: number;
  margin: "compact" | "normal" | "wide";
}

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  author: string;
  pages: PostPage[];
  thumbnail?: string; // 썸네일 이미지 경로 (선택사항)
  description?: string; // 짧은 설명 (선택사항)
  tags?: string[]; // 태그 배열 (선택사항)
  paper?: Paper;
  coverLayout?: CoverLayout;
}

export type CoverField =
  | "category"
  | "title"
  | "description"
  | "author"
  | "date";

export interface CoverFrame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hidden: boolean;
}

export interface CoverTextElement extends CoverFrame {
  kind: "text";
  field: CoverField;
  fontSize: number;
  font: "serif" | "sans";
  align: "left" | "center" | "right";
}

export interface CoverImageElement extends CoverFrame {
  kind: "image";
  src: string;
  alt: string;
  fit: "cover" | "contain";
}

export type CoverElement = CoverTextElement | CoverImageElement;

export interface CoverLayout {
  version: 1;
  elements: CoverElement[];
}

export type PostSummary = Omit<BlogPost, "pages"> & {
  pageCount: number;
  excerpt: string;
};
