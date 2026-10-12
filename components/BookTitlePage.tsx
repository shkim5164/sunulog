import type { BlogPost, Paper } from "@/types/post";
import { formatDate } from "@/lib/book";
import { normalizeCoverLayout } from "@/lib/cover";
import CoverCanvas from "@/components/CoverCanvas";
import FitBookContent from "@/components/FitBookContent";

export default function BookTitlePage({
  post,
  paper,
  preview = false,
}: {
  post: BlogPost;
  paper: Paper;
  preview?: boolean;
}) {
  const Heading = preview ? "h2" : "h1";
  const layout = normalizeCoverLayout(post.coverLayout);
  return (
    <section
      className={`book-leaf book-title-leaf paper-${paper} leaf-left`}
      aria-label="표지"
    >
      <div className="running-head">
        <span>Sunulog</span>
        <span>한 편의 기록</span>
      </div>
      {layout ? (
        <div className="custom-cover-slot">
          <CoverCanvas post={post} layout={layout} titleLevel={Heading} />
        </div>
      ) : (
        <FitBookContent
          className="leaf-content title-page-scroll"
          label="글 정보"
        >
          <header className="title-page-content">
            <div className="title-page-heading">
              <p className="title-page-category" aria-label="카테고리">
                {post.tags?.filter((tag) => tag.trim()).join(" · ") || "이야기"}
              </p>
              <Heading>{post.title || "제목 없는 이야기"}</Heading>
              {post.description && (
                <p className="title-page-description">{post.description}</p>
              )}
            </div>
            <div className="title-page-credit">
              <p>{post.author || "이름 없는 작가"} 씀</p>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </div>
          </header>
        </FitBookContent>
      )}
      <div className="leaf-folio">
        <span>표지</span>
      </div>
    </section>
  );
}
