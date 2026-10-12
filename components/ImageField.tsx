"use client";

import { useId, useRef, useState } from "react";
import Photo from "@/components/Photo";
import { imageSource } from "@/lib/media";

export default function ImageField({
  label,
  value,
  onChange,
  canUpload,
  onBusyChange,
  showPreview = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  canUpload: boolean;
  onBusyChange?: (busy: boolean) => void;
  showPreview?: boolean;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("8MB 이하의 사진을 선택해주세요.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/images", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onChange(result.src);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "업로드하지 못했어요. 다시 시도해주세요.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  return (
    <div className="image-field">
      <label htmlFor={id}>{label}</label>
      <div className="image-field-controls">
        <input
          id={id}
          value={value}
          maxLength={2048}
          disabled={busy}
          placeholder="https://… 또는 /images/…"
          onChange={(event) => {
            onChange(event.target.value);
            setError("");
          }}
          aria-describedby={`${id}-help`}
        />
        {canUpload && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              aria-label={`${label} 파일`}
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? "올리는 중…" : "사진 선택"}
            </button>
          </>
        )}
      </div>
      <p id={`${id}-help`}>
        {canUpload
          ? "사진을 업로드하거나 이미지 주소를 입력하세요. JPG · PNG · WebP · GIF, 최대 8MB."
          : "이미지 주소 또는 프로젝트의 이미지 경로를 입력하세요."}
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {value && !imageSource(value) && (
        <p className="field-error">
          https:// 주소 또는 /로 시작하는 이미지 경로를 입력해주세요.
        </p>
      )}
      {showPreview && imageSource(value) && (
        <div className="thumbnail-preview">
          <Photo src={value} alt="대표 이미지 미리보기" sizes="280px" />
        </div>
      )}
    </div>
  );
}
