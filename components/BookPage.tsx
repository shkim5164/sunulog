"use client";

import { useLayoutEffect, useRef, useMemo, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizePageStyle } from "@/lib/book";
import type { Paper, PostPage } from "@/types/post";
import type { ReaderComment, TextAnchor } from "@/types/comment";
import { rehypeAnnotations } from "@/lib/annotations";

export default function BookPage({
  page,
  paper,
  title,
  side = "left",
  children,
  fragment = 0,
  displayNumber = page?.pageNumber,
  onFragmentCount,
  measuring = false,
  annotationPage,
  threads,
  draftAnchor,
}: {
  page?: PostPage;
  paper: Paper;
  title: string;
  side?: "left" | "right";
  children?: React.ReactNode;
  fragment?: number;
  displayNumber?: number;
  onFragmentCount?: (count: number) => void;
  measuring?: boolean;
  annotationPage?: number;
  threads?: ReaderComment[];
  draftAnchor?: TextAnchor | null;
}) {
  const annotations = useMemo(
    () =>
      threads && !measuring && annotationPage !== undefined
        ? [
            [
              rehypeAnnotations,
              { threads, draft: draftAnchor, page: annotationPage },
            ] as [
              typeof rehypeAnnotations,
              {
                threads: ReaderComment[];
                draft: TextAnchor | null | undefined;
                page: number;
              },
            ],
          ]
        : [],
    [threads, measuring, annotationPage, draftAnchor],
  );
  const style = normalizePageStyle(page?.style);
  const empty = !page && !children;
  const viewport = useRef<HTMLDivElement>(null);
  const columns = useRef<HTMLDivElement>(null);
  const notify = useRef(onFragmentCount);
  notify.current = onFragmentCount;
  useLayoutEffect(() => {
    const frame = viewport.current;
    const content = columns.current;
    if (!frame || !content) return;
    let alive = true;
    let scheduled = 0;
    const measure = () => {
      if (!alive || !frame.clientHeight) return;
      content.style.setProperty(
        "--leaf-body-height",
        `${frame.clientHeight}px`,
      );
      const width = parseFloat(getComputedStyle(content).width);
      if (!width) return;
      const count = Math.max(1, Math.ceil((content.scrollWidth - 1) / width));
      notify.current?.(count);
      if (measuring) return;
      // Clipped columns must not receive keyboard focus or repeat off-page blocks.
      const bounds = frame.getBoundingClientRect();
      const visible = (element: Element) =>
        Array.from(element.getClientRects()).some(
          (rect) =>
            rect.right > bounds.left + 1 &&
            rect.left < bounds.right - 1 &&
            rect.bottom > bounds.top &&
            rect.top < bounds.bottom,
        );
      for (const block of Array.from(content.children)) {
        if (visible(block)) block.removeAttribute("aria-hidden");
        else block.setAttribute("aria-hidden", "true");
      }
      for (const link of Array.from(
        content.querySelectorAll<HTMLElement>(
          "a, [data-thread-ids][role='button']",
        ),
      )) {
        if (visible(link)) {
          if (link.hasAttribute("data-thread-ids"))
            link.setAttribute("tabindex", "0");
          else link.removeAttribute("tabindex");
        } else link.setAttribute("tabindex", "-1");
      }
    };
    const schedule = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    content.addEventListener("load", schedule, true);
    content.addEventListener("error", schedule, true);
    void document.fonts.ready.then(schedule);
    measure();
    return () => {
      alive = false;
      cancelAnimationFrame(scheduled);
      observer.disconnect();
      content.removeEventListener("load", schedule, true);
      content.removeEventListener("error", schedule, true);
    };
  }, [
    page?.content,
    page?.style,
    fragment,
    measuring,
    children,
    threads,
    draftAnchor,
  ]);
  return (
    <section
      className={`book-leaf paper-${paper} leaf-${side} layout-${style.layout} margin-${style.margin}`}
      aria-label={page ? `${displayNumber}쪽` : undefined}
      aria-hidden={empty || undefined}
    >
      <div className="running-head">
        <span>{title}</span>
        <span>Sunulog</span>
      </div>
      <div
        tabIndex={empty || measuring ? undefined : 0}
        role="region"
        aria-label={`${displayNumber || "마지막"}쪽 본문`}
        className={`leaf-content paginated-content font-${style.font}`}
        style={
          {
            "--reading-size": `${style.fontSize}px`,
            "--reading-leading": style.lineHeight,
            textAlign: style.align,
          } as CSSProperties
        }
      >
        <div className="leaf-viewport" ref={viewport}>
          <div
            className="leaf-columns"
            ref={columns}
            data-annotation-page={annotationPage}
            style={{ transform: `translateX(-${fragment * 100}%)` }}
          >
            {children ||
              (page ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={annotations}
                  skipHtml
                >
                  {page.content}
                </ReactMarkdown>
              ) : null)}
          </div>
        </div>
      </div>
      <div className="leaf-folio">
        <span>{page ? String(displayNumber).padStart(2, "0") : "·"}</span>
      </div>
    </section>
  );
}
