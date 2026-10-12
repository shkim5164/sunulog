"use client";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";

export default function AdminAuthButton({
  action = "signin",
  callbackUrl = "/admin",
  disabled = false,
}: {
  action?: "signin" | "signout";
  callbackUrl?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      if (action === "signout") await signOut({ callbackUrl: "/" });
      else await signIn("github", { callbackUrl });
    } catch {
      setError("연결하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  }
  return (
    <div className="admin-auth-action">
      <button
        type="button"
        className={action === "signin" ? "primary-button" : "secondary-button"}
        disabled={disabled || busy}
        aria-busy={busy}
        onClick={run}
      >
        {busy
          ? action === "signin"
            ? "GitHub로 이동 중…"
            : "로그아웃 중…"
          : action === "signin"
            ? "GitHub로 로그인"
            : "로그아웃"}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
