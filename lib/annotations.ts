import type { TextAnchor, ReaderComment, CommentColor } from "@/types/comment";

export const highlightColors: Record<CommentColor, string> = {
  amber: "#ead08099",
  mint: "#a5c8ae99",
  rose: "#e5a9b399",
  lavender: "#bcb0d999",
};

export function textRevision(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}

export function makeAnchor(
  text: string,
  page: number,
  start: number,
  end: number,
): TextAnchor {
  return {
    page,
    start,
    end,
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - 32), start),
    suffix: text.slice(end, end + 32),
    revision: textRevision(text),
  };
}

// Reattach a moved quote only when it is unambiguous; never color an unrelated sentence.
export function resolveAnchor(
  text: string,
  anchor: TextAnchor,
): { start: number; end: number } | null {
  if (!anchor.quote) return null;
  if (
    textRevision(text) === anchor.revision &&
    text.slice(anchor.start, anchor.end) === anchor.quote
  )
    return { start: anchor.start, end: anchor.end };
  const matches: { start: number; end: number; score: number }[] = [];
  let at = text.indexOf(anchor.quote);
  while (at !== -1) {
    const end = at + anchor.quote.length;
    const score =
      Number(
        Boolean(anchor.prefix) && text.slice(0, at).endsWith(anchor.prefix),
      ) +
      Number(
        Boolean(anchor.suffix) && text.slice(end).startsWith(anchor.suffix),
      );
    matches.push({ start: at, end, score });
    at = text.indexOf(anchor.quote, at + 1);
  }
  matches.sort((a, b) => b.score - a.score);
  if (
    !matches.length ||
    (matches.length > 1 && matches[0].score === matches[1].score)
  )
    return null;
  return { start: matches[0].start, end: matches[0].end };
}

interface TreeNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
}

export function treeText(node: TreeNode): string {
  if (node.type === "text") return node.value || "";
  return textChildren(node).map(treeText).join("");
}

function textChildren(node: TreeNode) {
  const table = ["table", "thead", "tbody", "tfoot", "tr"].includes(
    node.tagName || "",
  );
  return (node.children || []).filter(
    (child) =>
      child.type !== "raw" &&
      !(table && child.type === "text" && !child.value?.trim()),
  );
}

export function rehypeAnnotations(options: {
  threads: ReaderComment[];
  draft?: TextAnchor | null;
  page: number;
}) {
  return (tree: TreeNode) => {
    const text = treeText(tree);
    const ranges = options.threads.flatMap((thread) => {
      if (!thread.anchor || thread.anchor.page !== options.page) return [];
      const range = resolveAnchor(text, thread.anchor);
      return range ? [{ ...range, id: thread.id, color: thread.color }] : [];
    });
    const draft =
      options.draft?.page === options.page
        ? resolveAnchor(text, options.draft)
        : null;
    let offset = 0;
    const walk = (parent: TreeNode, insideLink = false) => {
      if (!parent.children) return;
      parent.children = textChildren(parent).flatMap((node) => {
        if (node.type !== "text") {
          walk(node, insideLink || node.tagName === "a");
          return [node];
        }
        const value = node.value || "";
        const start = offset;
        offset += value.length;
        const overlaps = ranges.filter(
          (range) => range.start < offset && range.end > start,
        );
        const pending =
          draft && draft.start < offset && draft.end > start ? draft : null;
        if (!overlaps.length && !pending) return [node];
        const points = new Set([start, offset]);
        for (const range of [...overlaps, ...(pending ? [pending] : [])]) {
          points.add(Math.max(start, range.start));
          points.add(Math.min(offset, range.end));
        }
        const boundaries = Array.from(points).sort((a, b) => a - b);
        return boundaries.slice(0, -1).map((from, i): TreeNode => {
          const to = boundaries[i + 1];
          const active = overlaps.filter(
            (range) => range.start < to && range.end > from,
          );
          const isDraft = pending && pending.start < to && pending.end > from;
          const child = {
            type: "text",
            value: value.slice(from - start, to - start),
          };
          if (!active.length && !isDraft) return child;
          const colors = Array.from(
            new Set(active.map((range) => highlightColors[range.color])),
          );
          const background =
            colors.length > 1
              ? `linear-gradient(to bottom, ${colors.map((color, index) => `${color} ${(index * 100) / colors.length}%, ${color} ${((index + 1) * 100) / colors.length}%`).join(", ")})`
              : colors[0] || highlightColors.amber;
          return {
            type: "element",
            tagName: "mark",
            properties: {
              className: [
                "annotation-mark",
                ...(isDraft ? ["annotation-draft"] : []),
              ],
              style: `background:${background};color:inherit`,
              ...(active.length
                ? {
                    "data-thread-ids": active
                      .map((range) => range.id)
                      .join(" "),
                    ...(insideLink
                      ? {}
                      : {
                          tabIndex: 0,
                          role: "button",
                          "aria-label": `${active.length}개의 문장 댓글 읽기`,
                        }),
                  }
                : {}),
            },
            children: [child],
          };
        });
      });
    };
    walk(tree);
  };
}
