"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, PageStyle, PostPage, PostSummary } from "@/types/post";
import {
  defaultPageStyle,
  isPaper,
  normalizePageStyle,
  pageTitle,
  paperForPost,
  papers,
  randomPaper,
  serializePost,
} from "@/lib/book";
import BookPagePreview from "@/components/BookPagePreview";
import BookReader from "@/components/BookReader";
import Icon from "@/components/Icon";
import ImageField from "@/components/ImageField";
import { imageSource, postImage } from "@/lib/media";
import CoverEditor from "@/components/CoverEditor";
import { isCoverLayoutInput } from "@/lib/cover";
import { youtubeVideoId } from "@/lib/youtube";

function newDraft(): BlogPost {
  const date = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
  return {
    id: 0,
    title: "",
    author: "",
    date,
    description: "",
    tags: [],
    paper: "cotton",
    pages: [{ pageNumber: 1, content: "", style: { ...defaultPageStyle } }],
  };
}

function isDraft(value: unknown): value is BlogPost {
  if (!value || typeof value !== "object") return false;
  const d = value as BlogPost;
  return (
    Number.isSafeInteger(d.id) &&
    d.id > 0 &&
    typeof d.title === "string" &&
    typeof d.author === "string" &&
    typeof d.date === "string" &&
    (d.youtubeUrl === undefined || typeof d.youtubeUrl === "string") &&
    isPaper(d.paper) &&
    Array.isArray(d.pages) &&
    d.pages.length > 0 &&
    d.pages.length <= 100 &&
    d.pages.every((p) => typeof p?.content === "string") &&
    (d.tags === undefined ||
      (Array.isArray(d.tags) && d.tags.every((tag) => typeof tag === "string")))
  );
}

export default function BookEditor({
  initialPost,
  canPublish,
  nextPosts,
}: {
  initialPost?: BlogPost;
  canPublish: boolean;
  nextPosts: PostSummary[];
}) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost>(() =>
    initialPost
      ? { ...initialPost, paper: paperForPost(initialPost) }
      : newDraft(),
  );
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [editingCover, setEditingCover] = useState(false);
  const [status, setStatus] = useState("초안 준비 중");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [undo, setUndo] = useState<{
    pages: PostPage[];
    active: number;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const saving = useRef(false);
  const storageKey = `blogspot:book-draft:${initialPost?.id || "new"}:v1`;
  const page = post.pages[active] || post.pages[0];
  const style = normalizePageStyle(page.style);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const draft: unknown = JSON.parse(saved);
        if (isDraft(draft) && (!initialPost || draft.id === initialPost.id)) {
          setPost(draft);
          setStatus("저장된 초안을 불러왔어요");
        } else {
          if (!initialPost)
            setPost((draft) => ({
              ...draft,
              id: Date.now(),
              paper: randomPaper(),
            }));
          setStatus("초안 형식을 읽지 못해 새로 시작했어요");
        }
      } else if (!initialPost) {
        setPost((draft) => ({
          ...draft,
          id: Date.now(),
          paper: randomPaper(),
        }));
      }
    } catch {
      if (!initialPost)
        setPost((draft) => ({
          ...draft,
          id: Date.now(),
          paper: randomPaper(),
        }));
      setStatus("브라우저 저장을 사용할 수 없어요. Markdown으로 보관해주세요.");
    }
    setReady(true);
  }, [storageKey, initialPost]);

  useEffect(() => {
    if (!ready || saving.current) return;
    const timer = setTimeout(() => {
      if (saving.current) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(post));
        setStatus("이 브라우저에 초안 저장됨");
      } catch {
        setStatus("초안을 저장하지 못했어요. Markdown으로 보관해주세요.");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [post, ready, storageKey]);

  function changePost(change: Partial<BlogPost>) {
    setPost((p) => ({ ...p, ...change }));
  }
  function openCover() {
    setPreview(false);
    setEditingCover(true);
    requestAnimationFrame(() =>
      workspace.current?.scrollIntoView({ block: "start" }),
    );
  }
  function changePage(change: Partial<PostPage>) {
    setPost((p) => ({
      ...p,
      pages: p.pages.map((item, i) =>
        i === active ? { ...item, ...change } : item,
      ),
    }));
  }
  function changeStyle(change: Partial<PageStyle>) {
    changePage({ style: { ...style, ...change } });
  }
  function setPages(pages: PostPage[], index: number) {
    setPost((p) => ({
      ...p,
      pages: pages.map((item, i) => ({ ...item, pageNumber: i + 1 })),
    }));
    setActive(index);
  }
  function addPage(duplicate = false) {
    if (post.pages.length >= 100) return;
    const next = [...post.pages];
    next.splice(active + 1, 0, {
      pageNumber: active + 2,
      content: duplicate ? page.content : "",
      style: { ...style },
    });
    setPages(next, active + 1);
    setEditingCover(false);
  }
  function movePage(direction: number) {
    const to = active + direction;
    if (to < 0 || to >= post.pages.length) return;
    const next = [...post.pages];
    [next[active], next[to]] = [next[to], next[active]];
    setPages(next, to);
  }
  function insert(before: string, after = "", placeholder = "텍스트") {
    const start = textarea.current?.selectionStart ?? page.content.length;
    const end = textarea.current?.selectionEnd ?? start;
    const selection = page.content.slice(start, end) || placeholder;
    changePage({
      content:
        page.content.slice(0, start) +
        before +
        selection +
        after +
        page.content.slice(end),
    });
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    });
  }
  function download() {
    const exported = { ...post, id: post.id || Date.now() };
    const url = URL.createObjectURL(
      new Blob([serializePost(exported)], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${post.date}-${exported.id}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function publish() {
    if (publishing) return;
    setError("");
    if (post.youtubeUrl?.trim() && !youtubeVideoId(post.youtubeUrl)) {
      setError("배경음악 YouTube 영상 링크를 확인하거나 비워주세요.");
      return;
    }
    if (post.thumbnail && !imageSource(post.thumbnail)) {
      setError("대표 이미지 주소를 확인하거나 비워주세요.");
      return;
    }
    if (post.coverLayout && !isCoverLayoutInput(post.coverLayout)) {
      setError("표지 이미지 주소를 확인하거나 비워주세요.");
      return;
    }
    if (
      !post.title.trim() ||
      !post.author.trim() ||
      !post.date ||
      post.pages.some(
        (p) => !p.content.trim() || /^---page---\s*$/m.test(p.content),
      )
    ) {
      setError(
        "제목, 작가, 날짜와 모든 페이지의 내용을 채워주세요. 페이지는 ‘페이지 추가’로 나눠주세요.",
      );
      return;
    }
    setPublishing(true);
    saving.current = true;
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: {
            ...post,
            id: post.id || Date.now(),
            tags: Array.from(
              new Set(post.tags?.map((tag) => tag.trim()).filter(Boolean)),
            ),
          },
          update: Boolean(initialPost),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "저장하지 못했어요. 다시 시도해주세요.",
        );
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* The post is safely on disk. */
      }
      router.push(`/post/${result.id}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "저장하지 못했어요. 다시 시도해주세요.",
      );
      saving.current = false;
      setPublishing(false);
    }
  }

  return (
    <main id="main-content" className="editor-main">
      <header className="editor-header">
        <div>
          <p className="quiet-label">THE WRITING ROOM</p>
          <h1>{initialPost ? "이야기 다듬기" : "새로운 이야기"}</h1>
          <p className="save-status" role="status">
            {status}
          </p>
        </div>
        <div className="editor-header-actions">
          <button
            className="secondary-button"
            disabled={!ready || publishing || uploadingImage}
            onClick={openCover}
          >
            표지·사진 편집
          </button>
          <button
            className="secondary-button"
            disabled={uploadingImage}
            onClick={() => setPreview(!preview)}
          >
            {preview ? "편집으로" : "책 미리보기"}
          </button>
          <button
            className="icon-button"
            title="Markdown 내려받기"
            aria-label="Markdown 내려받기"
            onClick={download}
          >
            <Icon name="download" />
          </button>
          {canPublish && (
            <button
              className="primary-button"
              disabled={!ready || publishing || uploadingImage}
              onClick={publish}
            >
              {publishing ? "저장 중…" : initialPost ? "수정 저장" : "글 등록"}
              <Icon name="arrow-right" />
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {!canPublish && (
        <p className="editor-notice">
          초안은 이 브라우저에 저장됩니다. 완성한 글은 Markdown으로 내려받아
          프로젝트의 posts 폴더에 추가해주세요.
        </p>
      )}
      {preview ? (
        <BookReader key="preview" post={post} nextPosts={nextPosts} preview />
      ) : (
        <fieldset disabled={!ready || publishing} className="editor-fieldset">
          <div className="book-details">
            <label className="title-field">
              <span>이야기 제목</span>
              <input
                maxLength={180}
                placeholder="어떤 이야기를 남길까요?"
                value={post.title}
                onChange={(e) => changePost({ title: e.target.value })}
              />
            </label>
            <div className="metadata-fields">
              <label>
                <span>작가</span>
                <input
                  maxLength={100}
                  placeholder="이름 또는 필명"
                  value={post.author}
                  onChange={(e) => changePost({ author: e.target.value })}
                />
              </label>
              <label>
                <span>날짜</span>
                <input
                  type="date"
                  value={post.date}
                  onChange={(e) => changePost({ date: e.target.value })}
                />
              </label>
              <label>
                <span>
                  태그 <small>쉼표로 구분</small>
                </span>
                <input
                  aria-label="태그"
                  placeholder="일상, 여행, 생각"
                  value={post.tags?.join(",") || ""}
                  onChange={(e) =>
                    changePost({ tags: e.target.value.split(",") })
                  }
                />
              </label>
            </div>
            <label className="description-field">
              <span>짧은 소개</span>
              <input
                maxLength={500}
                placeholder="표지에 담을 짧은 소개를 적어주세요."
                value={post.description || ""}
                onChange={(e) => changePost({ description: e.target.value })}
              />
            </label>
            <label className="description-field">
              <span>배경음악 YouTube 링크 <small>선택</small></span>
              <input
                type="url"
                maxLength={2048}
                placeholder="https://www.youtube.com/watch?v=…"
                value={post.youtubeUrl || ""}
                aria-describedby="youtube-link-help"
                aria-invalid={Boolean(post.youtubeUrl?.trim() && !youtubeVideoId(post.youtubeUrl))}
                onChange={(e) => changePost({ youtubeUrl: e.target.value })}
              />
              <small id="youtube-link-help">
                {post.youtubeUrl?.trim() && !youtubeVideoId(post.youtubeUrl)
                  ? "올바른 YouTube 영상 링크를 입력해주세요."
                  : "독자가 영상을 재생하면 책장을 넘겨도 음악이 이어져요. 비우면 음악이 제거됩니다."}
              </small>
            </label>
            <ImageField
              label="대표 이미지"
              value={
                post.thumbnail ?? (initialPost ? postImage(initialPost) : "")
              }
              onChange={(thumbnail) => changePost({ thumbnail })}
              canUpload={canPublish}
              onBusyChange={setUploadingImage}
            />
          </div>
          <div ref={workspace} className="editor-workspace">
            <aside className="page-sidebar">
              <div className="sidebar-heading">
                <h2>책의 구성</h2>
                <span>{post.pages.length}쪽</span>
              </div>
              <ol className="page-list">
                <li>
                  <button
                    disabled={uploadingImage}
                    aria-current={editingCover ? "page" : undefined}
                    onClick={() => setEditingCover(true)}
                  >
                    <span
                      className={`page-miniature paper-${paperForPost(post)}`}
                    >
                      <Icon name="pen" width="15" height="15" />
                    </span>
                    <span>표지 꾸미기</span>
                  </button>
                </li>
                {post.pages.map((item, i) => (
                  <li key={i}>
                    <button
                      aria-current={
                        !editingCover && active === i ? "page" : undefined
                      }
                      disabled={uploadingImage}
                      onClick={() => {
                        setActive(i);
                        setEditingCover(false);
                      }}
                    >
                      <span
                        className={`page-miniature paper-${paperForPost(post)}`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{pageTitle(item.content, i)}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <button
                className="add-page"
                disabled={uploadingImage || post.pages.length >= 100}
                onClick={() => addPage()}
              >
                <Icon name="plus" />
                페이지 추가
              </button>
              {!editingCover && (
                <div className="page-management">
                  <button
                    className="text-button"
                    disabled={active === 0}
                    onClick={() => movePage(-1)}
                  >
                    위로 ↑
                  </button>
                  <button
                    className="text-button"
                    disabled={active === post.pages.length - 1}
                    onClick={() => movePage(1)}
                  >
                    아래로 ↓
                  </button>
                  <button
                    className="text-button"
                    disabled={post.pages.length >= 100}
                    onClick={() => addPage(true)}
                  >
                    복제
                  </button>
                  <button
                    className="text-button"
                    disabled={post.pages.length <= 1}
                    onClick={() => {
                      setUndo({ pages: post.pages, active });
                      setPages(
                        post.pages.filter((_, i) => i !== active),
                        Math.max(0, active - 1),
                      );
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
              {undo && (
                <button
                  className="text-button undo-button"
                  onClick={() => {
                    setPages(undo.pages, undo.active);
                    setUndo(null);
                  }}
                >
                  페이지 삭제 되돌리기
                </button>
              )}
              <div className="paper-picker">
                <h2>이 책의 종이</h2>
                <div className="paper-swatches">
                  {papers.map((p) => (
                    <button
                      key={p.id}
                      title={p.description}
                      aria-label={`${p.name} 종이`}
                      aria-pressed={post.paper === p.id}
                      className={`paper-swatch paper-${p.id}`}
                      onClick={() => changePost({ paper: p.id })}
                    >
                      {post.paper === p.id && <Icon name="check" />}
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="text-button"
                  onClick={() => changePost({ paper: randomPaper(post.paper) })}
                >
                  <Icon name="shuffle" width="16" height="16" />
                  무작위로 고르기
                </button>
                <p>
                  처음에는 무작위로 골라드려요.
                  <br />
                  마음에 드는 종이로 바꿔도 좋아요.
                </p>
              </div>
            </aside>
            {editingCover ? (
              <CoverEditor
                post={post}
                onChange={(coverLayout) => changePost({ coverLayout })}
                canUpload={canPublish}
                onBusyChange={setUploadingImage}
                disabled={!ready || publishing}
              />
            ) : (
              <>
                <section
                  className="page-composer"
                  aria-label={`${active + 1}쪽 편집`}
                >
                  <div className="composer-heading">
                    <h2>
                      {String(active + 1).padStart(2, "0")}{" "}
                      <span>/ 페이지 편집</span>
                    </h2>
                    <span>Markdown</span>
                  </div>
                  <div className="format-toolbar" aria-label="본문 서식">
                    <button
                      aria-label="큰 제목 넣기"
                      onClick={() => insert("\n# ", "\n", "제목")}
                    >
                      H1
                    </button>
                    <button
                      aria-label="소제목 넣기"
                      onClick={() => insert("\n## ", "\n", "소제목")}
                    >
                      H2
                    </button>
                    <button
                      aria-label="굵은 글씨 넣기"
                      onClick={() => insert("**", "**")}
                    >
                      <b>B</b>
                    </button>
                    <button
                      aria-label="기울임 넣기"
                      onClick={() => insert("_", "_")}
                    >
                      <i>I</i>
                    </button>
                    <button
                      aria-label="인용문 넣기"
                      onClick={() => insert("\n> ", "\n", "마음에 남은 문장")}
                    >
                      “ ”
                    </button>
                    <button
                      aria-label="목록 넣기"
                      onClick={() => insert("\n- ", "\n", "목록")}
                    >
                      목록
                    </button>
                    <button
                      aria-expanded={imageOpen}
                      onClick={() => setImageOpen(!imageOpen)}
                    >
                      이미지
                    </button>
                  </div>
                  {imageOpen && (
                    <div className="image-insert">
                      <input
                        aria-label="이미지 주소"
                        placeholder="https://… 또는 /posts/images/…"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <button
                        className="text-button"
                        disabled={!imageUrl.trim()}
                        onClick={() => {
                          if (
                            !/^(https?:\/\/|\/(?!\/))[^\s<>]+$/.test(imageUrl)
                          ) {
                            setError(
                              "이미지 주소는 https:// 또는 /posts/images/로 시작해야 해요.",
                            );
                            return;
                          }
                          insert(
                            "\n![",
                            `](${encodeURI(imageUrl).replace(/\(/g, "%28").replace(/\)/g, "%29")})\n`,
                            "이미지 설명",
                          );
                          setImageOpen(false);
                          setImageUrl("");
                          setError("");
                        }}
                      >
                        삽입
                      </button>
                    </div>
                  )}
                  <textarea
                    ref={textarea}
                    className="manuscript"
                    aria-label={`${active + 1}쪽 내용`}
                    placeholder={
                      active === 0
                        ? "# 첫 장의 제목\n\n이곳에 이야기를 써 내려가세요.\n문단과 문단 사이에는 한 줄의 여백을 두고요."
                        : "다음 이야기를 이어가세요."
                    }
                    value={page.content}
                    onChange={(e) => changePage({ content: e.target.value })}
                  />
                  <div className="manuscript-footer">
                    <span>{page.content.length}자</span>
                    <span>한 장에 담고 싶은 만큼 써보세요.</span>
                  </div>
                  <div className="page-settings">
                    <label>
                      <span>페이지 구성</span>
                      <select
                        aria-label="페이지 구성"
                        value={style.layout}
                        onChange={(e) =>
                          changeStyle({
                            layout: e.target.value as PageStyle["layout"],
                          })
                        }
                      >
                        <option value="prose">본문</option>
                        <option value="title">장 제목</option>
                        <option value="quote">인용문</option>
                      </select>
                    </label>
                    <label>
                      <span>서체</span>
                      <select
                        aria-label="서체"
                        value={style.font}
                        onChange={(e) =>
                          changeStyle({
                            font: e.target.value as PageStyle["font"],
                          })
                        }
                      >
                        <option value="serif">고운바탕</option>
                        <option value="sans">고딕</option>
                      </select>
                    </label>
                    <label>
                      <span>정렬</span>
                      <select
                        aria-label="정렬"
                        value={style.align}
                        onChange={(e) =>
                          changeStyle({
                            align: e.target.value as PageStyle["align"],
                          })
                        }
                      >
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="justify">양쪽</option>
                      </select>
                    </label>
                    <label>
                      <span>여백</span>
                      <select
                        aria-label="여백"
                        value={style.margin}
                        onChange={(e) =>
                          changeStyle({
                            margin: e.target.value as PageStyle["margin"],
                          })
                        }
                      >
                        <option value="compact">좁게</option>
                        <option value="normal">보통</option>
                        <option value="wide">넓게</option>
                      </select>
                    </label>
                    <label>
                      <span>글자 크기 · {style.fontSize}px</span>
                      <input
                        type="range"
                        min="14"
                        max="24"
                        step="1"
                        value={style.fontSize}
                        onChange={(e) =>
                          changeStyle({ fontSize: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      <span>줄 간격 · {style.lineHeight.toFixed(2)}</span>
                      <input
                        type="range"
                        min="1.5"
                        max="2.4"
                        step="0.05"
                        value={style.lineHeight}
                        onChange={(e) =>
                          changeStyle({ lineHeight: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                </section>
                <section
                  className="live-preview"
                  aria-label="현재 페이지 미리보기"
                >
                  <div className="preview-caption">
                    <span>한 장 미리보기</span>
                    <span>
                      {papers.find((p) => p.id === post.paper)?.name} 종이
                    </span>
                  </div>
                  <BookPagePreview
                    page={{ ...page, pageNumber: active + 1 }}
                    paper={paperForPost(post)}
                    title={post.title || "제목 없는 이야기"}
                  />
                </section>
              </>
            )}
          </div>
        </fieldset>
      )}
    </main>
  );
}
