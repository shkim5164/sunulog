"use client";

import { useRef, useState } from "react";

export default function ImageUploadButton({
  disabled,
  onUploaded,
  onBusyChange,
}: {
  disabled: boolean;
  onUploaded: (src: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 8 * 1024 * 1024) {
      setError("8MB 이하의 사진을 선택해주세요.");
      return;
    }
    setBusy(true);
    onBusyChange(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch("/api/images", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "사진을 업로드하지 못했어요.");
      onUploaded(result.src);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "사진을 업로드하지 못했어요.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="cover-photo-upload">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        aria-label="새 표지 사진 파일"
        disabled={disabled || busy}
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <button
        type="button"
        className="primary-button"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "사진 올리는 중…" : "사진 넣기"}
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
