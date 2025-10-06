"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { BlogPost } from "@/types/post";

interface BookReaderProps {
  post: BlogPost;
}

export default function BookReader({ post }: BookReaderProps) {
  // 현재 펼쳐진 페이지의 왼쪽 페이지 인덱스 (0부터 시작)
  const [currentSpread, setCurrentSpread] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalPages = post.pages.length;

  const nextSpread = () => {
    // 다음 펼침으로 이동 (2페이지씩)
    if (currentSpread + 2 < totalPages) {
      setDirection(1);
      setCurrentSpread(currentSpread + 2);
    }
  };

  const prevSpread = () => {
    // 이전 펼침으로 이동 (2페이지씩)
    if (currentSpread > 0) {
      setDirection(-1);
      setCurrentSpread(Math.max(0, currentSpread - 2));
    }
  };

  // 키보드 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSpread();
      } else if (e.key === "ArrowLeft") {
        prevSpread();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpread]);

  // 현재 펼침에서 보이는 왼쪽, 오른쪽 페이지
  const leftPage = post.pages[currentSpread];
  const rightPage = post.pages[currentSpread + 1];

  // 왼쪽 페이지는 이전으로 갈 때 회전
  const leftPageVariants = {
    enter: {
      rotateY: 0,
      opacity: 1,
      zIndex: 1,
      transformOrigin: "right center",
    },
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 2,
      transformOrigin: "right center",
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? 180 : 0,
      opacity: direction < 0 ? 1 : 0,
      zIndex: direction < 0 ? 3 : 2,
      transformOrigin: "right center",
    }),
  };

  // 오른쪽 페이지는 다음으로 갈 때 회전
  const rightPageVariants = {
    enter: {
      rotateY: 0,
      opacity: 1,
      zIndex: 1,
      transformOrigin: "left center",
    },
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 2,
      transformOrigin: "left center",
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? -180 : 0,
      opacity: direction > 0 ? 1 : 0,
      zIndex: direction > 0 ? 3 : 2,
      transformOrigin: "left center",
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600">
      <div className="w-full max-w-7xl">
        {/* 책 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mt-4">{post.title}</h1>
          <p className="text-white/80 mt-2">
            {post.author} · {post.date}
          </p>
        </div>

        {/* 펼쳐진 책 (두 페이지) */}
        <div className="relative page-flip-container">
          <div className="flex gap-1 book-shadow rounded-lg overflow-hidden">
            {/* 왼쪽 페이지 - 이전으로 갈 때 회전 */}
            <div
              className="flex-1 relative min-h-[700px] border-r-2 border-gray-300/50"
              style={{ perspective: "2000px" }}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={`left-${currentSpread}`}
                  custom={direction}
                  variants={leftPageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    rotateY: {
                      type: "spring",
                      stiffness: 60,
                      damping: 20,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 bg-[var(--page-bg)] page-texture p-8 md:p-12 page-3d"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {leftPage ? (
                    <>
                      <div className="prose prose-lg max-w-none mb-16 h-full overflow-auto markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          className="text-[var(--text-color)] leading-relaxed"
                        >
                          {leftPage.content}
                        </ReactMarkdown>
                      </div>
                      {/* 왼쪽 페이지 번호 */}
                      <div className="absolute bottom-8 left-8 text-gray-400 text-sm font-serif">
                        {leftPage.pageNumber}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p className="text-lg">시작 페이지</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 오른쪽 페이지 - 3D 회전 */}
            <div
              className="flex-1 relative min-h-[700px]"
              style={{ perspective: "2000px" }}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={`right-${currentSpread}`}
                  custom={direction}
                  variants={rightPageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    rotateY: {
                      type: "spring",
                      stiffness: 60,
                      damping: 20,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 bg-[var(--page-bg)] page-texture p-8 md:p-12 page-3d"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {rightPage ? (
                    <>
                      <div className="prose prose-lg max-w-none mb-16 h-full overflow-auto markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          className="text-[var(--text-color)] leading-relaxed"
                        >
                          {rightPage.content}
                        </ReactMarkdown>
                      </div>
                      {/* 오른쪽 페이지 번호 */}
                      <div className="absolute bottom-8 right-8 text-gray-400 text-sm font-serif">
                        {rightPage.pageNumber}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p className="text-lg">끝</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevSpread}
              disabled={currentSpread === 0}
              className="px-8 py-3 bg-white/90 backdrop-blur-sm rounded-lg font-semibold text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              ← 이전
            </button>

            {/* 페이지 인디케이터 */}
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(totalPages / 2) }).map(
                (_, index) => {
                  const spreadIndex = index * 2;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setDirection(spreadIndex > currentSpread ? 1 : -1);
                        setCurrentSpread(spreadIndex);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        spreadIndex === currentSpread
                          ? "bg-white w-8"
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                      aria-label={`${spreadIndex + 1}-${
                        spreadIndex + 2
                      } 페이지로 이동`}
                    />
                  );
                }
              )}
            </div>

            <button
              onClick={nextSpread}
              disabled={currentSpread + 2 >= totalPages}
              className="px-8 py-3 bg-white/90 backdrop-blur-sm rounded-lg font-semibold text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              다음 →
            </button>
          </div>
        </div>

        {/* 키보드 안내 */}
        <div className="text-center mt-8 text-white/60 text-sm">
          💡 Tip: 키보드 방향키(← →)로도 페이지를 넘길 수 있습니다
        </div>
      </div>
    </div>
  );
}
