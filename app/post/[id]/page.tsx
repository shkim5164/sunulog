import { getPostById, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import BookReader from "@/components/BookReader";

export default function PostPage({ params }: { params: { id: string } }) {
  const post = getPostById(parseInt(params.id));

  if (!post) {
    notFound();
  }

  return <BookReader post={post} />;
}

// 정적 생성을 위한 params 목록
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}
