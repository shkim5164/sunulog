import { getPostById, getAllPosts, getPostsSummary } from "@/lib/posts";
import { notFound } from "next/navigation";
import BookReader from "@/components/BookReader";
import { excerptOf } from "@/lib/book";

export function generateMetadata({ params }: { params: { id: string } }) {
  const post = getPostById(Number(params.id));
  return post
    ? {
        title: post.title,
        description:
          post.description || excerptOf(post.pages[0]?.content || ""),
      }
    : { title: "이야기를 찾을 수 없습니다" };
}

export default function PostPage({ params }: { params: { id: string } }) {
  const post = getPostById(Number(params.id));

  if (!post) {
    notFound();
  }

  const nextPosts = getPostsSummary()
    .filter((story) => story.id !== post.id)
    .slice(0, 2);
  return <BookReader key={post.id} post={post} nextPosts={nextPosts} />;
}

// 정적 생성을 위한 params 목록
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}
