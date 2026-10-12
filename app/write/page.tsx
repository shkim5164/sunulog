import BookEditor from "@/components/BookEditor";
import { getPostById, getPostsSummary } from "@/lib/posts";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import AdminOnly from "@/components/AdminOnly";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "이야기 쓰기",
  robots: { index: false, follow: false },
};

export default async function WritePage({
  searchParams,
}: {
  searchParams: { post?: string };
}) {
  const returnTo = `/write${searchParams.post ? `?post=${encodeURIComponent(searchParams.post)}` : ""}`;
  await requireAdminPage(returnTo);
  const post = searchParams.post
    ? getPostById(Number(searchParams.post))
    : undefined;
  if (searchParams.post && !post) notFound();
  return (
    <AdminOnly returnTo={returnTo}>
      <BookEditor
        key={post?.id || "new"}
        initialPost={post}
        nextPosts={getPostsSummary()
          .filter((story) => story.id !== post?.id)
          .slice(0, 2)}
        canPublish={process.env.NODE_ENV === "development"}
      />
    </AdminOnly>
  );
}
