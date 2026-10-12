import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getPostsSummary } from "@/lib/posts";
import AdminAuthButton from "@/components/AdminAuthButton";
import AdminOnly from "@/components/AdminOnly";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "관리자의 작업실",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdminPage("/admin");
  const posts = getPostsSummary();
  return (
    <AdminOnly returnTo="/admin">
      <main id="main-content" className="admin-main">
        <header className="admin-heading">
          <div>
            <h1>이야기를 만드는 작업실</h1>
            <p>{session.user?.name || "관리자"}님으로 로그인했습니다.</p>
          </div>
          <AdminAuthButton action="signout" />
        </header>
        <nav className="admin-tools" aria-label="관리자 작업">
          <Link href="/write" className="primary-button">
            <Icon name="pen" />새 이야기 쓰기
          </Link>
          <Link href="/settings" className="secondary-button">
            메인 화면 설정
          </Link>
        </nav>
        {process.env.NODE_ENV !== "development" && (
          <p className="editor-notice">
            현재는 글을 파일로 보관하는 방식입니다. 작성한 글을 Markdown으로
            내려받아 프로젝트에 추가하고 다시 배포하면 공개됩니다. 온라인 발행과
            사진 업로드는 저장소 연결 후 사용할 수 있습니다.
          </p>
        )}
        <section className="admin-posts" aria-label="글 관리">
          <h2>
            책장에 담긴 이야기 <span>{posts.length}</span>
          </h2>
          {posts.length ? (
            <ul>
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/write?post=${post.id}`}>
                    <span>{post.title}</span>
                    <span className="admin-edit-label">
                      편집 <Icon name="arrow-right" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>아직 이야기가 없습니다. 첫 번째 글을 써보세요.</p>
          )}
        </section>
      </main>
    </AdminOnly>
  );
}
