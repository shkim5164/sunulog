import { getPostsSummary } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import PostsGrid from "@/components/PostsGrid";

export default function AllPostsPage() {
  const posts = getPostsSummary();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <PostsGrid posts={posts} />
      </main>
    </>
  );
}
