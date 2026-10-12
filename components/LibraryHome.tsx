import Link from "next/link";
import type { PostSummary } from "@/types/post";
import type { SiteSettings } from "@/lib/site";
import PostsGrid from "@/components/PostsGrid";
import Photo from "@/components/Photo";

export default function LibraryHome({
  summaries,
  settings,
}: {
  summaries: PostSummary[];
  settings: SiteSettings;
}) {
  return (
    <main id="main-content" className="library-main">
      <section className="home-introduction" aria-label="블로그 소개">
        <div className="home-hero-photo">
          <Photo
            src={settings.heroImage}
            alt={settings.heroAlt}
            position={settings.imagePosition}
            priority
            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1200px) calc(100vw - 96px), 1104px"
          />
        </div>
        <h1>{settings.introduction}</h1>
      </section>
      <PostsGrid posts={summaries} compact />
      <footer className="site-footer">
        <span className="footer-wordmark">Sunulog.</span>
        <p>모든 날이 이야기가 되는 곳.</p>
        <Link className="text-link" href="/admin">
          관리자 작업실
        </Link>
        <span>천천히, 한 장씩.</span>
      </footer>
    </main>
  );
}
