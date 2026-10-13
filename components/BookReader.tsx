"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { BlogPost, PostSummary } from "@/types/post";
import { pageTitle, paperForPost } from "@/lib/book";
import BookPage from "@/components/BookPage";
import PostMusic from "@/components/PostMusic";
import BookTitlePage from "@/components/BookTitlePage";
import BookEndPage from "@/components/BookEndPage";
import Icon from "@/components/Icon";
import { remapBookPosition } from "@/lib/pagination";
import { useSession } from "next-auth/react";
import {
  ReaderCommentsPanel,
  useReaderComments,
} from "@/components/ReaderComments";
import type { TextAnchor } from "@/types/comment";
import { resolveAnchor } from "@/lib/annotations";
import { textRange } from "@/lib/annotation-dom";

export default function BookReader({
  post,
  preview = false,
  nextPosts = [],
}: {
  post: BlogPost;
  preview?: boolean;
  nextPosts?: PostSummary[];
}) {
  const { data: session } = useSession();
  const [pagination, setPagination] = useState({
    current: 0,
    counts: [] as number[],
  });
  const [single, setSingle] = useState(false);
  const [direction, setDirection] = useState(1);
  const [toc, setToc] = useState(false);
  const [isTurning, setIsTurning] = useState(false);
  const book = useRef<HTMLDivElement>(null);
  const comments = useReaderComments(post.id, !preview, book, isTurning);
  const turning = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();
  const step = single ? 1 : 2;
  const current = Math.floor(pagination.current / step) * step;
  const setCurrent = useCallback(
    (value: number | ((previous: number) => number)) => {
      setPagination((previous) => ({
        ...previous,
        current: typeof value === "function" ? value(previous.current) : value,
      }));
    },
    [],
  );
  const updateCount = useCallback(
    (source: number, count: number) => {
      setPagination((previous) => {
        const before = post.pages.map(
          (_, index) => previous.counts[index] || 1,
        );
        if (before[source] === count) return previous;
        const after = [...before];
        after[source] = count;
        return {
          counts: after,
          current: remapBookPosition(previous.current, before, after, 1),
        };
      });
    },
    [post.pages],
  );
  const pages = post.pages.flatMap((page, source) =>
    Array.from({ length: pagination.counts[source] || 1 }, (_, fragment) => ({
      page,
      source,
      fragment,
    })),
  );
  // Cover and recommendations are reader-owned leaves, outside authored page numbers.
  const endIndex = pages.length + 1;
  const total = endIndex + 1;
  const lastVisible = Math.min(current + step - 1, endIndex);
  const position =
    current === endIndex
      ? "다음 이야기"
      : lastVisible === endIndex
        ? `${current} · 다음 이야기`
        : current === 0
          ? `표지${lastVisible > 0 ? " · 1" : ""}`
          : `${current}${lastVisible > current ? ` — ${lastVisible}` : ""}`;
  const paper = paperForPost(post);
  const Container = preview ? "section" : "main";
  const recommendations = nextPosts
    .filter((story) => story.id !== post.id)
    .slice(0, 2);
  function leaf(index: number, side: "left" | "right") {
    if (index === 0)
      return <BookTitlePage post={post} paper={paper} preview={preview} />;
    if (index === endIndex)
      return (
        <BookEndPage
          posts={recommendations}
          paper={paper}
          title={post.title}
          side={side}
        />
      );
    return (
      <BookPage
        page={pages[index - 1]?.page}
        fragment={pages[index - 1]?.fragment}
        displayNumber={index}
        paper={paper}
        title={post.title}
        side={side}
        annotationPage={pages[index - 1]?.source}
        threads={preview ? undefined : comments.comments}
        draftAnchor={comments.open ? comments.anchor : null}
      />
    );
  }
  const leafVariants = (side: "left" | "right") => ({
    enter: (turn: number) => ({
      opacity: 0,
      x: single && !reduced ? `${turn * 14}%` : "0%",
      rotateY: reduced
        ? 0
        : single
          ? 0
          : side === "left" && turn > 0
            ? 80
            : side === "right" && turn < 0
              ? -80
              : 0,
    }),
    center: { opacity: 1, rotateY: 0, x: "0%" },
    exit: (turn: number) => ({
      opacity: 0,
      x: single && !reduced ? `${turn * -14}%` : "0%",
      rotateY: reduced
        ? 0
        : single
          ? 0
          : side === "right" && turn > 0
            ? -80
            : side === "left" && turn < 0
              ? 80
              : 0,
    }),
  });
  const go = useCallback(
    (target: number) => {
      if (turning.current) return;
      const next = Math.max(
        0,
        Math.min(
          Math.floor((total - 1) / step) * step,
          Math.floor(target / step) * step,
        ),
      );
      if (next === current) return;
      turning.current = true;
      setIsTurning(true);
      setDirection(next > current ? 1 : -1);
      setCurrent(next);
    },
    [current, step, total, setCurrent],
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => {
      turning.current = false;
      setIsTurning(false);
      setSingle(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        target.closest(
          "input, textarea, select, [contenteditable='true'], .annotation-panel",
        )
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(current + step);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(current - step);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, step, go]);

  useEffect(() => {
    if (current >= total)
      setCurrent(Math.max(0, Math.floor((total - 1) / step) * step));
  }, [total, current, step, setCurrent]);

  return (
    <Container
      id={preview ? undefined : "main-content"}
      className={`reader-main ${preview ? "reader-preview" : ""} ${comments.open && !preview ? "reader-with-comments" : ""}`}
    >
      <div className="reader-topline">
        {preview ? (
          <span>독자에게 보이는 모습</span>
        ) : (
          <Link href="/posts" className="text-link">
            <Icon name="arrow-left" />
            서재로
          </Link>
        )}
        <div className="reader-actions">
          {!preview && (
            <button
              id="reader-comments-toggle"
              className="text-button"
              aria-expanded={comments.open}
              aria-haspopup="dialog"
              onClick={() =>
                comments.open ? comments.close() : comments.setOpen(true)
              }
            >
              문장 댓글{" "}
              <span>
                {comments.comments.filter((comment) => !comment.parentId)
                  .length || ""}
              </span>
            </button>
          )}
          <button
            className="text-button"
            aria-expanded={toc}
            onClick={() => setToc(!toc)}
          >
            <Icon name="list" />
            목차
          </button>
          {!preview && session?.isAdmin && (
            <Link href={`/write?post=${post.id}`} className="text-link">
              <Icon name="pen" />
              편집
            </Link>
          )}
        </div>
      </div>
      {toc && (
        <nav className="book-toc" aria-label="페이지 목차">
          <button
            disabled={isTurning}
            aria-current={current === 0 ? "page" : undefined}
            onClick={() => {
              go(0);
              setToc(false);
            }}
          >
            <span>—</span>
            표지
          </button>
          {post.pages.map((page, i) => {
            const start = pages.findIndex((leaf) => leaf.source === i) + 1;
            const count = pagination.counts[i] || 1;
            return (
              <button
                key={i}
                disabled={isTurning}
                aria-current={
                  start <= lastVisible && start + count > current
                    ? "page"
                    : undefined
                }
                onClick={() => {
                  go(start);
                  setToc(false);
                }}
              >
                <span>{String(start).padStart(2, "0")}</span>
                {pageTitle(page.content, i)}
              </button>
            );
          })}
          <button
            disabled={isTurning}
            aria-current={
              current <= endIndex && lastVisible === endIndex
                ? "page"
                : undefined
            }
            onClick={() => {
              go(endIndex);
              setToc(false);
            }}
          >
            <span>—</span>
            다음 이야기
          </button>
        </nav>
      )}
      <PostMusic key={post.id} url={post.youtubeUrl} />
      <div
        className="reader-book"
        ref={book}
        aria-busy={isTurning}
        onPointerUp={() => requestAnimationFrame(comments.captureSelection)}
        onClick={(event) => {
          if (window.getSelection()?.toString()) return;
          const mark = (event.target as Element).closest<HTMLElement>(
            "[data-thread-ids]",
          );
          if (mark) {
            event.preventDefault();
            comments.showThreads(mark.dataset.threadIds?.split(" "));
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const mark = (event.target as Element).closest<HTMLElement>(
            "[data-thread-ids]",
          );
          if (mark) {
            event.preventDefault();
            comments.showThreads(mark.dataset.threadIds?.split(" "));
          }
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchStart={(event) => {
          touch.current = {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          };
        }}
        onTouchEnd={(event) => {
          if (!touch.current || window.getSelection()?.toString()) {
            touch.current = null;
            return;
          }
          const dx = event.changedTouches[0].clientX - touch.current.x;
          const dy = event.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
            go(current + (dx < 0 ? step : -step));
          touch.current = null;
        }}
      >
        <div
          className="book-measurements"
          aria-hidden="true"
          ref={(element) => element?.setAttribute("inert", "")}
          style={{ width: single ? "100%" : "50%" }}
        >
          {post.pages.map((page, index) => (
            <BookPage
              key={index}
              page={page}
              paper={paper}
              title={post.title}
              measuring
              annotationPage={index}
              onFragmentCount={(count) => updateCount(index, count)}
            />
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={`${single ? "single" : "spread"}-${current}`}
            className={`book-spread ${single ? "single-page" : ""}`}
            initial="enter"
            animate="center"
            exit="exit"
            custom={direction}
            onAnimationComplete={(definition) => {
              if (definition === "center") {
                turning.current = false;
                setIsTurning(false);
              }
            }}
          >
            <motion.div
              className="page-turn left-page-turn"
              custom={direction}
              variants={leafVariants("left")}
              transition={{
                duration: reduced ? 0.12 : 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {leaf(current, "left")}
            </motion.div>
            {!single && (
              <motion.div
                className="page-turn right-page-turn"
                custom={direction}
                variants={leafVariants("right")}
                transition={{
                  duration: reduced ? 0.12 : 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {leaf(current + 1, "right")}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="reader-controls">
        <button
          className="page-button"
          onClick={() => go(current - step)}
          disabled={isTurning || current === 0}
        >
          <Icon name="arrow-left" />
          <span>이전 장</span>
        </button>
        <div className="page-position">
          <span aria-live="polite">
            {position} <span className="muted">/ 본문 {pages.length}쪽</span>
          </span>
          <div className="reading-progress">
            <span
              style={{
                transform: `scaleX(${Math.min((current + step) / total, 1)})`,
              }}
            />
          </div>
        </div>
        <button
          className="page-button"
          onClick={() => go(current + step)}
          disabled={isTurning || current + step >= total}
        >
          <span>다음 장</span>
          <Icon name="arrow-right" />
        </button>
      </div>
      <p className="reader-hint">
        {single
          ? "좌우로 쓸어넘겨 다음 이야기를 읽어보세요."
          : "키보드 ← → 로도 책장을 넘길 수 있어요."}
      </p>
      {!preview && (
        <>
          <p className="annotation-hint">
            마음에 닿은 문장을 드래그해, 이야기를 남겨보세요.
          </p>
          <ReaderCommentsPanel
            state={comments}
            postId={post.id}
            isAdmin={Boolean(session?.isAdmin)}
            onJump={(anchor: TextAnchor) => {
              const root = book.current?.querySelector<HTMLElement>(
                `.book-measurements [data-annotation-page="${anchor.page}"]`,
              );
              const start = pages.findIndex(
                (leaf) => leaf.source === anchor.page,
              );
              if (!root || start < 0) return false;
              const range = resolveAnchor(root.textContent || "", anchor);
              if (!range) return false;
              const rect = range
                ? textRange(root, range.start, range.end)?.getClientRects()[0]
                : null;
              const bounds = root.getBoundingClientRect();
              const fragment =
                rect && bounds.width
                  ? Math.max(
                      0,
                      Math.floor((rect.left - bounds.left + 1) / bounds.width),
                    )
                  : 0;
              go(start + 1 + fragment);
              return true;
            }}
          />
        </>
      )}
    </Container>
  );
}
