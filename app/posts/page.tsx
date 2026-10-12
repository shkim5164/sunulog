import { getPostsSummary } from "@/lib/posts";
import PostsGrid from "@/components/PostsGrid";

export default function AllPostsPage() {
  return (
    <main id="main-content" className="library-main">
      <PostsGrid posts={getPostsSummary()} />
    </main>
  );
}
