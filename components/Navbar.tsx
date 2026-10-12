"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Sunulog 홈">
        <Icon name="book" />
        <span>
          Sunulog<span className="brand-dot">.</span>
        </span>
      </Link>
      <span className="brand-caption">삶의 조각을 모아, 한 권의 책으로</span>
      <nav className="site-nav" aria-label="주 메뉴">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          서재
        </Link>
        <Link
          href="/posts"
          aria-current={pathname === "/posts" ? "page" : undefined}
        >
          모든 글
        </Link>
        <Link
          href={session?.isAdmin ? "/admin" : "/login"}
          className="write-link"
          aria-current={
            ["/admin", "/login", "/write", "/settings"].includes(pathname)
              ? "page"
              : undefined
          }
        >
          <Icon name="pen" />
          <span>{session?.isAdmin ? "작업실" : "관리자"}</span>
        </Link>
      </nav>
    </header>
  );
}
