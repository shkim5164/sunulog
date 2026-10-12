import type { NextRequest } from "next/server";

export function isLocalWrite(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  try {
    const origin = new URL(request.headers.get("origin") || "");
    return (
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) &&
      origin.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}

export async function limitedBody(
  request: NextRequest,
  maximum: number,
): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maximum) {
      await reader.cancel();
      throw new RangeError("요청 크기가 너무 큽니다.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
