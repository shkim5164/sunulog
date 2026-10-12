import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { treeText } from "@/lib/annotations";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);
export function markdownText(markdown: string) {
  return treeText(processor.runSync(processor.parse(markdown)));
}
