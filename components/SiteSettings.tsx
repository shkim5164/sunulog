"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SiteSettings as Settings } from "@/lib/site";
import { imageSource } from "@/lib/media";
import ImageField from "@/components/ImageField";
import Photo from "@/components/Photo";
import Icon from "@/components/Icon";

export default function SiteSettings({
  initial,
  canSave,
}: {
  initial: Settings;
  canSave: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!imageSource(settings.heroImage) || !settings.introduction.trim()) {
      setError("이미지 주소와 소개 문장을 입력해주세요.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "저장하지 못했어요. 다시 시도해주세요.",
      );
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="settings-main">
      <Link href="/" className="text-link">
        <Icon name="arrow-left" />
        서재로
      </Link>
      <header className="settings-heading">
        <h1>메인 화면 설정</h1>
        <p>첫 화면의 사진과 짧은 소개를 바꿔보세요.</p>
      </header>
      <form onSubmit={save}>
        <fieldset disabled={busy} className="editor-fieldset settings-fields">
          <ImageField
            label="메인 이미지"
            value={settings.heroImage}
            onChange={(heroImage) => setSettings((s) => ({ ...s, heroImage }))}
            canUpload={canSave}
            onBusyChange={setUploading}
            showPreview={false}
          />
          <label>
            <span>이미지 설명</span>
            <input
              maxLength={180}
              value={settings.heroAlt}
              onChange={(e) =>
                setSettings((s) => ({ ...s, heroAlt: e.target.value }))
              }
            />
          </label>
          <label>
            <span>소개 한 줄</span>
            <input
              required
              maxLength={120}
              value={settings.introduction}
              onChange={(e) =>
                setSettings((s) => ({ ...s, introduction: e.target.value }))
              }
            />
          </label>
          <label>
            <span>사진의 세로 위치 · {settings.imagePosition}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.imagePosition}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  imagePosition: Number(e.target.value),
                }))
              }
            />
          </label>
        </fieldset>
        <section className="settings-preview" aria-label="메인 화면 미리보기">
          <div className="home-hero-photo">
            <Photo
              src={settings.heroImage}
              alt={settings.heroAlt}
              position={settings.imagePosition}
              sizes="(max-width: 800px) 90vw, 800px"
            />
          </div>
          <p>{settings.introduction}</p>
        </section>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="settings-actions">
          <Link className="secondary-button" href="/">
            돌아가기
          </Link>
          <button
            className="primary-button"
            disabled={!canSave || busy || uploading}
          >
            {busy ? "저장 중…" : "변경 저장"}
          </button>
        </div>
        {!canSave && (
          <p className="editor-notice">
            변경한 설정은 로컬 개발 서버에서 저장할 수 있어요.
          </p>
        )}
      </form>
    </main>
  );
}
