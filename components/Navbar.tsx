"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* 로고 */}
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            BlogSpot<span className="text-purple-600">.</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-base text-gray-700 hover:text-gray-900 transition-colors"
            >
              홈
            </Link>
            <Link
              href="/posts"
              className="text-base text-gray-700 hover:text-gray-900 transition-colors"
            >
              전체 포스트
            </Link>
          </div>

          {/* 오른쪽 버튼들 */}
          <div className="flex items-center space-x-3">
            <button
              className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
              aria-label="검색"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-6 py-2 rounded-full border-2 border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition-all"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
