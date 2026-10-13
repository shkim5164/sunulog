"use client";

import { memo } from "react";
import { youtubeVideoId } from "@/lib/youtube";

// Keep this outside the animated/keyed book leaves so page turns retain playback.
export default memo(function PostMusic({ url }: { url?: string }) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return (
    <aside className="post-music" aria-label="이 글의 배경음악">
      <iframe
        key={id}
        src={`https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`}
        title="이 글의 배경음악 YouTube 플레이어"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <div className="post-music-caption">
        <strong>이 글과 함께 듣는 음악</strong>
        <p>영상을 재생하면 책장을 넘겨도 음악이 이어져요.</p>
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
          재생되지 않나요? YouTube에서 열기 ↗
        </a>
      </div>
    </aside>
  );
});
