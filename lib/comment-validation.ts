import {
  commentColors,
  type NewComment,
  type TextAnchor,
} from "@/types/comment";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validAnchor(value: unknown): value is TextAnchor {
  if (!value || typeof value !== "object") return false;
  const a = value as TextAnchor;
  return (
    Number.isSafeInteger(a.page) &&
    a.page >= 0 &&
    Number.isSafeInteger(a.start) &&
    a.start >= 0 &&
    Number.isSafeInteger(a.end) &&
    a.end > a.start &&
    a.end - a.start <= 500 &&
    typeof a.quote === "string" &&
    a.quote.trim().length > 0 &&
    a.quote.length === a.end - a.start &&
    typeof a.prefix === "string" &&
    a.prefix.length <= 32 &&
    typeof a.suffix === "string" &&
    a.suffix.length <= 32 &&
    typeof a.revision === "string" &&
    a.revision.length <= 16
  );
}
export function parseComment(value: unknown): NewComment | null {
  if (!value || typeof value !== "object") return null;
  const v = value as NewComment;
  if (
    typeof v.id !== "string" ||
    !uuidPattern.test(v.id) ||
    !Number.isSafeInteger(v.postId) ||
    v.postId <= 0 ||
    typeof v.body !== "string" ||
    !v.body.trim() ||
    v.body.length > 2000 ||
    typeof v.author !== "string" ||
    v.author.length > 24 ||
    !commentColors.includes(v.color) ||
    (v.parentId !== null &&
      (typeof v.parentId !== "string" || !uuidPattern.test(v.parentId))) ||
    (v.parentId === null ? !validAnchor(v.anchor) : v.anchor !== null)
  )
    return null;
  return {
    id: v.id,
    postId: v.postId,
    parentId: v.parentId,
    anchor: v.anchor,
    color: v.color,
    author: v.author.trim() || "익명",
    body: v.body.trim(),
  };
}
