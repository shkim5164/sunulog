import type { BlogPost } from "@/types/post";

export function imageSource(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const source = value.trim();
  if (!source || source.length > 2048 || /[\s<>\\]/.test(source))
    return undefined;
  if (source.startsWith("/") && !source.startsWith("//")) return source;
  try {
    const url = new URL(source);
    if (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      return source;
  } catch {
    /* Invalid or incomplete address. */
  }
  return undefined;
}

// Curated defaults for the three starter stories. An author's thumbnail always wins.
const starterImages: Record<number, string> = {
  1: "/images/forest-path.jpg",
  3: "/images/bookshop.jpg",
  5: "/images/starry-night.jpg",
};

export function postImage(post: Pick<BlogPost, "id" | "thumbnail">) {
  return (
    imageSource(post.thumbnail) ||
    starterImages[post.id] ||
    "/images/reading-window.jpg"
  );
}
