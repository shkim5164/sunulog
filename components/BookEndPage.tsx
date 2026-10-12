/* Hallmark · component: reading recommendations · genre: editorial · theme: Paper library
 * pre-emit critique: P5 H4 E4 S5 R5 V4
 */
import Link from "next/link";
import type { Paper, PostSummary } from "@/types/post";
import { postImage } from "@/lib/media";
import Photo from "@/components/Photo";
import Icon from "@/components/Icon";

export default function BookEndPage({
  posts,
  paper,
  title,
  side,
}: {
  posts: PostSummary[];
  paper: Paper;
  title: string;
  side: "left" | "right";
}) {
  return (
    <section
      className={`book-leaf book-end-leaf paper-${paper} leaf-${side}`}
      aria-label="다음 이야기"
    >
      <div className="running-head">
        <span>{title}</span>
        <span>Sunulog</span>
      </div>
      <div
        className="book-end-content"
        role="region"
        aria-label="다른 이야기 둘러보기"
      >
        <h2>다음으로 펼칠 이야기</h2>
        <nav className="book-end-cards" aria-label="다른 이야기 추천">
          {posts.length ? (
            posts.map((post) => (
              <Link
                className="book-end-card"
                href={`/post/${post.id}`}
                key={post.id}
              >
                <div className="book-end-photo">
                  <Photo
                    src={postImage(post)}
                    alt=""
                    sizes="(max-width: 767px) 85vw, 40vw"
                  />
                </div>
                <div className="book-end-card-caption">
                  <h3 title={post.title}>{post.title}</h3>
                  <Icon name="arrow-right" />
                </div>
              </Link>
            ))
          ) : (
            <Link className="book-end-card" href="/posts">
              <div className="book-end-photo">
                <Photo
                  src="/images/reading-window.jpg"
                  alt=""
                  sizes="(max-width: 767px) 85vw, 40vw"
                />
              </div>
              <div className="book-end-card-caption">
                <h3>서재에서 다시 골라보기</h3>
                <Icon name="arrow-right" />
              </div>
            </Link>
          )}
        </nav>
        <Link className="text-link book-end-all" href="/posts">
          모든 이야기 둘러보기 <Icon name="arrow-right" />
        </Link>
      </div>
      <div className="leaf-folio">
        <span>·</span>
      </div>
    </section>
  );
}
