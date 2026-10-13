"use client";

import { useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { adminReturnPath } from "@/lib/auth-policy";
import { authErrorMessage } from "@/lib/auth-config";

export default function AdminLoginForm({ callbackUrl, disabled }: { callbackUrl: string; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || disabled) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      const result = await signIn("credentials", {
        username: fields.get("username"), password: fields.get("password"),
        callbackUrl: adminReturnPath(callbackUrl), redirect: false,
      });
      if (!result?.ok || result.error) {
        setError(authErrorMessage(result?.error || "Unknown"));
        (form.elements.namedItem("password") as HTMLInputElement).value = "";
        return;
      }
      // Full navigation synchronizes the server session and all cached admin UI.
      window.location.assign(adminReturnPath(callbackUrl));
    } catch {
      setError("연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="admin-login-form" onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={disabled || busy}>
        <label htmlFor="admin-username">아이디</label>
        <input id="admin-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={64} aria-describedby={error ? "login-error" : undefined} />
        <label htmlFor="admin-password">비밀번호</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} aria-describedby={error ? "login-error" : undefined} />
        <button type="submit" className="primary-button">{busy ? "로그인 중…" : "로그인"}</button>
      </fieldset>
      {error && <p id="login-error" className="auth-error" role="alert">{error}</p>}
    </form>
  );
}
