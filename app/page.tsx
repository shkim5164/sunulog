import Link from "next/link";
import { getPostsSummary } from "@/lib/posts";
import Navbar from "@/components/Navbar";

export default function Home() {
  const posts = getPostsSummary();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        {/* 메인 섹션 */}
        <section className="pt-8 pb-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* 헤더 */}
            <div className="flex justify-between items-end mb-12">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 italic leading-tight">
                Best of the week
              </h1>
              <Link
                href="/posts"
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 group mb-2 hidden md:flex"
              >
                전체 포스트 보기
                <span className="transform group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            {/* 그리드 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 큰 카드 - 첫 번째 포스트 */}
              {posts[0] && (
                <Link
                  href={`/post/${posts[0].id}`}
                  className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-300 to-blue-400 h-[600px]"
                  style={{
                    backgroundImage: posts[0].thumbnail
                      ? `url(${posts[0].thumbnail})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* 콘텐츠 */}
                  <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <span className="inline-block w-fit px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-900">
                      {posts[0].date}
                    </span>
                    <span className="inline-block w-fit px-3 py-1.5 bg-white/30 backdrop-blur-sm rounded-full text-sm text-gray-900 border border-white/50">
                      • Travel
                    </span>
                  </div>

                  {/* 제목 말풍선 */}
                  <div className="absolute top-32 right-6 max-w-sm">
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                      <span className="text-xs text-gray-500 mb-2 block">
                        • Travel
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        {posts[0].title}
                      </h2>
                    </div>
                  </div>

                  {/* 화살표 버튼 */}
                  <button className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">↗</span>
                  </button>
                </Link>
              )}

              {/* 오른쪽 작은 카드들 */}
              {posts[1] && (
                <div className="rounded-3xl bg-gradient-to-br from-teal-200 to-teal-300 p-8 flex flex-col justify-between min-h-[292px]">
                  <div className="flex justify-between items-start">
                    <span className="inline-block px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-full text-xs font-medium text-gray-900 border border-white/50">
                      • Tag
                    </span>
                    <button className="w-8 h-8 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {posts[1].title}
                    </h3>
                    <p className="text-xl text-gray-900 font-semibold mb-4">
                      {posts[1].description}
                    </p>
                    <Link
                      href={`/post/${posts[1].id}`}
                      className="text-gray-900 font-medium underline hover:no-underline"
                    >
                      Read more
                    </Link>
                  </div>
                </div>
              )}

              {posts[2] && (
                <Link
                  href={`/post/${posts[2].id}`}
                  className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-300 to-green-400 min-h-[292px]"
                  style={{
                    backgroundImage: posts[2].thumbnail
                      ? `url(${posts[2].thumbnail})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* 배지 */}
                  <div className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-gray-900 text-sm">
                    24
                  </div>

                  {/* 하단 버튼 */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white rounded-full px-6 py-3 text-center font-medium text-gray-900 flex items-center justify-center gap-2 group-hover:bg-gray-50 transition-colors">
                      See all picks
                      <span className="transform group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* 더 많은 포스트가 있을 경우를 위한 여백 */}
            {posts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">아직 포스트가 없습니다.</p>
                <p className="text-gray-400 mt-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">posts/</code>{" "}
                  폴더에 Markdown 파일을 추가해보세요!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
