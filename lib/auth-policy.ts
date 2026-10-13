export function adminReturnPath(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return "/admin";
  try {
    const url = new URL(value, "https://sunulog.invalid");
    if (
      url.origin !== "https://sunulog.invalid" ||
      !["/admin", "/write", "/settings"].includes(url.pathname)
    )
      return "/admin";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/admin";
  }
}

export function sameOrigin(origin: string | null, siteUrl: string | undefined) {
  if (!origin || !siteUrl) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
