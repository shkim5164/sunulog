/** Accept only video links; never use an author's URL directly as an iframe source. */
export function youtubeVideoId(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value.trim());
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username || url.password || url.port
    ) return;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    let id: string | null | undefined;
    if (host === "youtu.be" && parts.length === 1) id = parts[0];
    else if ([
      "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com",
      "youtube-nocookie.com", "www.youtube-nocookie.com",
    ].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])) id = parts[1];
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : undefined;
  } catch {
    return;
  }
}

export function normalizeYoutubeUrl(value: unknown): string | undefined {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : undefined;
}
