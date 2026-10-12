"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  commentColors,
  type CommentColor,
  type ReaderComment,
  type TextAnchor,
} from "@/types/comment";
import { highlightColors, makeAnchor } from "@/lib/annotations";

const colorNames = {
  amber: "노랑",
  mint: "초록",
  rose: "분홍",
  lavender: "보라",
};

export function useReaderComments(
  postId: number,
  enabled: boolean,
  book: RefObject<HTMLDivElement>,
  turning: boolean,
) {
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<TextAnchor | null>(null);
  const [active, setActive] = useState<string[]>([]);
  const [mode, setMode] = useState<"local" | "shared" | "unavailable">(
    "unavailable",
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const refreshing = useRef(false);
  const generation = useRef(0);
  const changes = useRef(0);
  const updateComments = useCallback(
    (update: SetStateAction<ReaderComment[]>) => {
      changes.current++;
      setComments(update);
    },
    [],
  );
  const abort = useRef<AbortController>();
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    if (!enabled || refreshing.current) return;
    refreshing.current = true;
    const requestGeneration = ++generation.current;
    const version = changes.current;
    const controller = new AbortController();
    abort.current = controller;
    try {
      const all: ReaderComment[] = [];
      let cursor: number | null = 0;
      let storage: "local" | "shared" = "shared";
      do {
        const response: Response = await fetch(
          `/api/comments?postId=${postId}&after=${cursor}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data: {
          comments: ReaderComment[];
          nextCursor: number | null;
          mode: "local" | "shared";
          error?: string;
        } = await response.json();
        if (!response.ok)
          throw new Error(data.error || "댓글을 불러오지 못했어요.");
        all.push(...data.comments);
        storage = data.mode;
        cursor = data.nextCursor;
      } while (cursor !== null);
      if (alive.current && requestGeneration === generation.current) {
        if (version === changes.current) setComments(all);
        setMode(storage);
        setLoadError("");
      }
    } catch (error) {
      if (
        alive.current &&
        requestGeneration === generation.current &&
        (error as Error).name !== "AbortError"
      )
        setLoadError(
          error instanceof Error ? error.message : "댓글을 불러오지 못했어요.",
        );
    } finally {
      if (requestGeneration === generation.current) {
        refreshing.current = false;
        if (alive.current) setLoading(false);
      }
    }
  }, [enabled, postId]);
  useEffect(() => {
    alive.current = true;
    if (!enabled) return;
    void refresh();
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      alive.current = false;
      refreshing.current = false;
      abort.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [enabled, refresh]);

  const captureSelection = useCallback(() => {
    if (!enabled || turning) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const element =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as Element)
        : range.startContainer.parentElement;
    const root = element?.closest<HTMLElement>("[data-annotation-page]");
    if (
      !root ||
      !book.current?.contains(root) ||
      root.closest(".book-measurements") ||
      !root.contains(range.endContainer)
    )
      return;
    const before = document.createRange();
    before.selectNodeContents(root);
    before.setEnd(range.startContainer, range.startOffset);
    const text = root.textContent || "";
    let start = before.toString().length;
    let end = start + range.toString().length;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end <= start) return;
    if (end - start > 500) {
      setLoadError("댓글을 남길 문장을 500자 이내로 선택해주세요.");
      setOpen(true);
      return;
    }
    const next = makeAnchor(
      text,
      Number(root.dataset.annotationPage),
      start,
      end,
    );
    setAnchor((previous) =>
      previous?.page === next.page &&
      previous.start === next.start &&
      previous.end === next.end
        ? previous
        : next,
    );
    setActive([]);
    setOpen(true);
  }, [enabled, turning, book]);
  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    const select = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(captureSelection, 280);
    };
    document.addEventListener("selectionchange", select);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("selectionchange", select);
    };
  }, [enabled, captureSelection]);
  const close = useCallback(() => {
    setOpen(false);
    window.getSelection()?.removeAllRanges();
    document.getElementById("reader-comments-toggle")?.focus();
  }, []);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, close]);
  const showThreads = useCallback((ids: string[] = []) => {
    window.getSelection()?.removeAllRanges();
    setAnchor(null);
    setActive(ids);
    setOpen(true);
  }, []);
  return {
    comments,
    setComments: updateComments,
    open,
    setOpen,
    anchor,
    setAnchor,
    active,
    showThreads,
    close,
    mode,
    loading,
    loadError,
    refresh,
    captureSelection,
  };
}

export function ReaderCommentsPanel({
  state,
  postId,
  isAdmin,
  onJump,
}: {
  state: ReturnType<typeof useReaderComments>;
  postId: number;
  isAdmin: boolean;
  onJump: (anchor: TextAnchor) => boolean;
}) {
  const [color, setColor] = useState<CommentColor>("amber");
  const [author, setAuthor] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef<{ fingerprint: string; id: string }>();
  const posting = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const threads = state.comments.filter((comment) => !comment.parentId);
  const visible = state.active.length
    ? threads.filter((thread) => state.active.includes(thread.id))
    : threads;
  useEffect(() => {
    if (state.anchor) {
      setReplyTo(null);
      setColor(commentColors[threads.length % commentColors.length]);
      setError("");
      setNotice("");
    }
    // A new selection starts a new conversation; text drafts survive opening/closing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.anchor]);
  const key = state.anchor ? "new" : replyTo || "new";
  const body = drafts[key] || "";
  const canWrite = state.mode !== "unavailable" && !state.loading;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (posting.current || !body.trim() || (!state.anchor && !replyTo)) return;
    const input = {
      postId,
      parentId: state.anchor ? null : replyTo,
      anchor: state.anchor,
      color,
      author,
      body,
    };
    const fingerprint = JSON.stringify(input);
    if (pending.current?.fingerprint !== fingerprint)
      pending.current = { fingerprint, id: crypto.randomUUID() };
    posting.current = true;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, id: pending.current.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "댓글을 저장하지 못했어요.");
      state.setComments((previous) =>
        [
          ...previous.filter((comment) => comment.id !== data.comment.id),
          data.comment,
        ].sort((a, b) => a.seq - b.seq),
      );
      setDrafts((previous) => ({ ...previous, [key]: "" }));
      state.showThreads([data.comment.parentId || data.comment.id]);
      setReplyTo(null);
      pending.current = undefined;
      setNotice("이야기를 남겼습니다.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "연결이 끊겼어요. 작성한 내용은 그대로 두었습니다. 다시 등록해주세요.",
      );
    } finally {
      posting.current = false;
      setSending(false);
    }
  }
  async function remove(comment: ReaderComment) {
    if (
      !window.confirm(
        comment.parentId
          ? "이 답글을 삭제할까요?"
          : "이 댓글과 답글을 모두 삭제할까요?",
      )
    )
      return;
    setError("");
    try {
      const response = await fetch(
        `/api/comments?postId=${postId}&id=${comment.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error((await response.json()).error);
      state.setComments((previous) =>
        previous.filter(
          (item) => item.id !== comment.id && item.parentId !== comment.id,
        ),
      );
      if (!comment.parentId) state.showThreads();
      setNotice("댓글을 삭제했습니다.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "삭제하지 못했어요.");
    }
  }
  if (!state.open) return null;
  const form = (
    <form className="comment-form" onSubmit={submit}>
      <label>
        이름 <span className="muted">선택 · 비워두면 익명</span>
        <input
          aria-label="댓글 이름"
          maxLength={24}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="익명"
          autoComplete="off"
          disabled={sending}
        />
      </label>
      <label>
        {state.anchor ? "남기고 싶은 이야기" : "답글"}
        <textarea
          ref={textarea}
          aria-label={state.anchor ? "댓글 내용" : "답글 내용"}
          value={body}
          maxLength={2000}
          rows={4}
          onChange={(event) =>
            setDrafts((previous) => ({
              ...previous,
              [key]: event.target.value,
            }))
          }
          placeholder="이 문장을 읽으며 어떤 생각이 들었나요?"
          required
          disabled={!canWrite || sending}
        />
      </label>
      <div className="comment-form-footer">
        <span>{body.length} / 2,000</span>
        <button
          type="submit"
          className="primary-button"
          disabled={!canWrite || sending || !body.trim()}
        >
          {sending
            ? "남기는 중…"
            : state.anchor
              ? "익명 댓글 남기기"
              : "익명 답글 남기기"}
        </button>
      </div>
      <p className="comment-privacy">
        로그인 없이 공개됩니다. 개인정보는 남기지 말아주세요.
      </p>
    </form>
  );
  const item = (comment: ReaderComment) => (
    <div className="comment-message">
      <div className="comment-byline">
        <strong>{comment.author}</strong>
        <time dateTime={comment.createdAt}>
          {new Intl.DateTimeFormat("ko-KR", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(comment.createdAt))}
        </time>
        {isAdmin && (
          <button
            type="button"
            className="text-button"
            aria-label={`${comment.author} 댓글 삭제`}
            onClick={() => void remove(comment)}
          >
            삭제
          </button>
        )}
      </div>
      <p>{comment.body}</p>
    </div>
  );
  return (
    <aside
      className="annotation-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="comment-panel-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          state.close();
        }
        event.stopPropagation();
      }}
    >
      <header className="annotation-panel-head">
        <div>
          <span className="quiet-label">IN THE MARGINS</span>
          <h2 id="comment-panel-title">문장 사이의 이야기</h2>
        </div>
        <button
          type="button"
          className="comment-close"
          aria-label="댓글 창 닫기"
          onClick={state.close}
        >
          ×
        </button>
      </header>
      <div className="annotation-panel-body">
        {state.mode === "local" && (
          <p className="comment-storage-note">로컬 미리보기의 댓글입니다.</p>
        )}
        {state.loading && (
          <p role="status">책에 남겨진 이야기를 읽고 있어요.</p>
        )}
        {state.loadError && (
          <div className="comment-error" role="alert">
            <p>{state.loadError}</p>
            <button
              type="button"
              className="text-button"
              onClick={() => void state.refresh()}
            >
              다시 불러오기
            </button>
          </div>
        )}
        {error && (
          <p className="comment-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="comment-success" role="status">
            {notice}
          </p>
        )}
        {state.anchor ? (
          <section className="comment-compose">
            <p className="comment-section-label">선택한 문장에 남기기</p>
            <blockquote style={{ borderColor: highlightColors[color] }}>
              {state.anchor.quote}
            </blockquote>
            <fieldset className="comment-colors">
              <legend>문장의 색</legend>
              {commentColors.map((option) => (
                <label key={option} title={colorNames[option]}>
                  <input
                    type="radio"
                    name="comment-color"
                    value={option}
                    checked={color === option}
                    onChange={() => setColor(option)}
                    aria-label={`${colorNames[option]} 강조색`}
                  />
                  <span style={{ background: highlightColors[option] }} />
                </label>
              ))}
            </fieldset>
            {form}
            <button
              type="button"
              className="text-button"
              onClick={() => state.showThreads()}
            >
              남겨진 댓글 보기 ({threads.length})
            </button>
          </section>
        ) : (
          <>
            {state.active.length > 0 && (
              <button
                type="button"
                className="text-button comment-back"
                onClick={() => {
                  state.showThreads();
                  setReplyTo(null);
                }}
              >
                ← 모든 문장 댓글 ({threads.length})
              </button>
            )}
            {!visible.length && !state.loading && (
              <div className="comments-empty">
                <p>마음에 닿은 문장이 있나요?</p>
                <span>본문을 드래그해 첫 이야기를 남겨보세요.</span>
              </div>
            )}
            <div className="comment-threads">
              {visible.map((thread) => (
                <article
                  key={thread.id}
                  className="comment-thread"
                  data-comment-id={thread.id}
                >
                  <button
                    type="button"
                    className="comment-quote"
                    style={{ borderColor: highlightColors[thread.color] }}
                    onClick={() => {
                      if (thread.anchor && !onJump(thread.anchor))
                        setError(
                          "원문이 수정되어 문장을 찾지 못했어요. 남겨진 대화는 계속 읽을 수 있습니다.",
                        );
                    }}
                    title="이 문장으로 이동"
                  >
                    “{thread.anchor?.quote}”
                  </button>
                  {item(thread)}
                  <div className="comment-replies">
                    {state.comments
                      .filter((comment) => comment.parentId === thread.id)
                      .map((reply) => (
                        <div key={reply.id} data-comment-id={reply.id}>
                          {item(reply)}
                        </div>
                      ))}
                  </div>
                  <button
                    type="button"
                    className="text-button comment-reply-button"
                    disabled={!canWrite || sending}
                    onClick={() => {
                      setReplyTo(thread.id);
                      setError("");
                      setNotice("");
                      window.setTimeout(() => textarea.current?.focus(), 0);
                    }}
                  >
                    {replyTo === thread.id ? "답글 쓰는 중" : "답글 남기기"}
                  </button>
                  {replyTo === thread.id && form}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="annotation-panel-foot">
        한 문장, 여러 사람의 생각.
      </footer>
    </aside>
  );
}
