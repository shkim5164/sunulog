export const commentColors = ["amber", "mint", "rose", "lavender"] as const;
export type CommentColor = (typeof commentColors)[number];

export interface TextAnchor {
  page: number;
  start: number;
  end: number;
  quote: string;
  prefix: string;
  suffix: string;
  revision: string;
}

export interface ReaderComment {
  id: string;
  seq: number;
  postId: number;
  parentId: string | null;
  anchor: TextAnchor | null;
  color: CommentColor;
  author: string;
  body: string;
  createdAt: string;
}

export type NewComment = Pick<
  ReaderComment,
  "id" | "postId" | "parentId" | "anchor" | "color" | "author" | "body"
>;
