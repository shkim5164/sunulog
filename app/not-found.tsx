import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-[var(--page-bg)] book-shadow rounded-lg p-12 max-w-2xl w-full page-texture text-center">
        <h1 className="text-6xl font-bold text-[var(--text-color)] mb-4">
          404
        </h1>
        <p className="text-2xl text-gray-600 mb-8">페이지를 찾을 수 없습니다</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
