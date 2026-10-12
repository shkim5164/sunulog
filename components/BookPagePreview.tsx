"use client";

import { useEffect, useState } from "react";
import type { Paper, PostPage } from "@/types/post";
import BookPage from "@/components/BookPage";

export default function BookPagePreview({
  page,
  paper,
  title,
}: {
  page: PostPage;
  paper: Paper;
  title: string;
}) {
  const [count, setCount] = useState(1);
  const [fragment, setFragment] = useState(0);
  useEffect(() => setFragment(0), [page.content, page.pageNumber]);
  const current = Math.min(fragment, count - 1);
  return (
    <>
      <BookPage
        page={page}
        paper={paper}
        title={title}
        fragment={current}
        onFragmentCount={setCount}
      />
      {count > 1 && (
        <div className="page-preview-controls" aria-label="나뉜 원고 미리보기">
          <button
            type="button"
            className="text-button"
            disabled={current === 0}
            onClick={() => setFragment(current - 1)}
          >
            이전 쪽
          </button>
          <span aria-live="polite">
            {current + 1} / {count}
          </span>
          <button
            type="button"
            className="text-button"
            disabled={current + 1 >= count}
            onClick={() => setFragment(current + 1)}
          >
            다음 쪽
          </button>
        </div>
      )}
      <p>긴 내용은 화면 크기에 맞춰 다음 책장으로 이어집니다.</p>
    </>
  );
}
