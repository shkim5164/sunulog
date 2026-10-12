import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="empty-state">
      <p className="quiet-label">404 · PAGE NOT FOUND</p>
      <h1>이 장은 아직 쓰이지 않았어요.</h1>
      <p>찾으시는 이야기가 없거나 주소가 바뀌었어요.</p>
      <Link className="primary-button" href="/posts">
        서재로 돌아가기
      </Link>
    </main>
  );
}
