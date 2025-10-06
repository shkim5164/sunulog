"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type SortOrder = "newest" | "oldest";

interface PostSummary {
  id: number;
  title: string;
  date: string;
  author: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
}

interface PostsGridProps {
  posts: PostSummary[];
}

export default function PostsGrid({ posts }: PostsGridProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedTag, setSelectedTag] = useState<string>("전체");

  // 모든 태그 수집
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag));
    });
    return ["전체", ...Array.from(tagSet).sort()];
  }, [posts]);

  // 태그 필터링 및 정렬된 포스트 목록
  const sortedPosts = useMemo(() => {
    let filteredPosts = posts;

    // 태그 필터링
    if (selectedTag !== "전체") {
      filteredPosts = posts.filter((post) => post.tags?.includes(selectedTag));
    }

    // 정렬
    const postsCopy = [...filteredPosts];
    if (sortOrder === "newest") {
      return postsCopy.sort((a, b) => (a.date > b.date ? -1 : 1));
    } else {
      return postsCopy.sort((a, b) => (a.date < b.date ? -1 : 1));
    }
  }, [posts, sortOrder, selectedTag]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            모든 포스트
          </h1>
          <p className="text-gray-600 text-lg">
            총 {sortedPosts.length}개의 이야기
          </p>
        </div>

        {/* 정렬 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => setSortOrder("newest")}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              sortOrder === "newest"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortOrder("oldest")}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              sortOrder === "oldest"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            오래된 순
          </button>
        </div>
      </div>

      {/* 태그 필터 */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 포스트 그리드 */}
      {sortedPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">아직 포스트가 없습니다.</p>
          <p className="text-gray-400 mt-2">
            <code className="bg-gray-200 px-2 py-1 rounded">posts/</code> 폴더에
            Markdown 파일을 추가해보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="group block"
            >
              <article className="h-full bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* 썸네일 */}
                <div
                  className="h-64 bg-gradient-to-br from-purple-300 to-pink-300 relative overflow-hidden"
                  style={{
                    backgroundImage: post.thumbnail
                      ? `url(${post.thumbnail})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* 날짜 배지 */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-block px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-900 shadow-md">
                      {post.date}
                    </span>
                  </div>

                  {/* 화살표 버튼 */}
                  <div className="absolute bottom-4 right-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-xl">↗</span>
                    </div>
                  </div>
                </div>

                {/* 내용 */}
                <div className="p-6">
                  {/* 태그 */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{post.author}</span>
                    <span className="text-purple-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      읽기
                      <span className="transform group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
