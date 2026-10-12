"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { adminReturnPath } from "@/lib/auth-policy";

// Also hide cached editor UI immediately after logout in this or another tab.
export default function AdminOnly({
  children,
  returnTo,
}: {
  children: React.ReactNode;
  returnTo: string;
}) {
  const { data, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status !== "loading" && !data?.isAdmin)
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(adminReturnPath(returnTo))}`,
      );
  }, [data?.isAdmin, status, router, returnTo]);
  if (!data?.isAdmin)
    return (
      <main id="main-content" className="auth-main">
        <p role="status">관리자 로그인을 확인하고 있습니다.</p>
      </main>
    );
  return children;
}
