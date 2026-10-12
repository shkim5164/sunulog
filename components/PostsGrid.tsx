"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostSummary } from "@/types/post";
import { postImage } from "@/lib/media";
import Photo from "@/components/Photo";
import Icon from "@/components/Icon";

export default function PostsGrid({
  posts,
  compact = false,
}: {
  posts: PostSummary[];
  compact?: boolean;
}) {
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedTag, setSelectedTag] = useState("");
  const [search, setSearch] = useState("");
  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags || []))),
    [posts],
  );
  const filtered = useMemo(
    () =>
      posts
        .filter(
          (post) =>
            (!selectedTag || post.tags?.includes(selectedTag)) &&
            `${post.title} ${post.description || ""} ${post.excerpt} ${post.tags?.join(" ") || ""}`
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()),
        )
        .sort((a, b) =>
          sortOrder === "newest"
            ? b.date.localeCompare(a.date)
            : a.date.localeCompare(b.date),
        ),
    [posts, selectedTag, sortOrder, search],
  );
  const Heading = compact ? "h2" : "h1";
  return (
    <section
      className={`posts-section ${compact ? "" : "full-archive"}`}
      aria-label="이야기 목록"
    >
      <div className="section-heading">
        <div>
          <Heading>{compact ? "책장에 꽂힌 이야기" : "모든 이야기"}</Heading>
          <span>{posts.length}편의 기록</span>
        </div>
        {compact ? (
          <Link className="text-link" href="/posts">
            전체 보기 <Icon name="arrow-right" />
          </Link>
        ) : (
          <p>다시 펼쳐 읽고 싶은 순간들을 모았습니다.</p>
        )}
      </div>
      <div className="archive-toolbar">
        <div className="tag-filters" aria-label="태그 필터">
          <button
            aria-pressed={!selectedTag}
            onClick={() => setSelectedTag("")}
          >
            전체
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              aria-pressed={selectedTag === tag}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="archive-tools">
          <label className="search-field">
            <Icon name="search" width="17" height="17" />
            <input
              aria-label="이야기 검색"
              placeholder="이야기 찾기"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="글 정렬"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된 순</option>
          </select>
        </div>
      </div>
      {filtered.length ? (
        <div className="story-grid">
          {filtered.map((post) => (
            <Link
              className="story-card photo-story-card"
              href={`/post/${post.id}`}
              key={post.id}
            >
              <div className="story-photo">
                <Photo
                  src={postImage(post)}
                  alt=""
                  sizes="(max-width: 599px) calc(100vw - 48px), (max-width: 767px) 45vw, (max-width: 1200px) 30vw, 347px"
                />
              </div>
              <h3>{post.title}</h3>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>
            {posts.length
              ? "일치하는 이야기가 없어요."
              : "책장이 아직 비어 있어요."}
          </h3>
          <p>
            {posts.length
              ? "다른 검색어나 태그로 찾아보세요."
              : "첫 번째 이야기를 써서 책장을 채워보세요."}
          </p>
          {posts.length ? (
            <button
              className="text-button"
              onClick={() => {
                setSelectedTag("");
                setSearch("");
              }}
            >
              필터 초기화
            </button>
          ) : (
            <Link className="text-link" href="/write">
              글 쓰기 <Icon name="pen" />
            </Link>
          )}
        </div>
      )}
      <p className="archive-count" aria-live="polite">
        {filtered.length}편의 이야기
      </p>
    </section>
  );
}
