"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function AdminAuthButton(_props: { action?: "signout" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-auth-action">
      <button
        type="button"
        className="secondary-button"
        disabled={busy}
        aria-busy={busy}
        onClick={run}
      >
        {busy ? "로그아웃 중…" : "로그아웃"}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
