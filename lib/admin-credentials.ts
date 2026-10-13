import { createHash, scrypt, timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function credentialVersion(env: Environment) {
  return createHash("sha256")
    .update(JSON.stringify([env.ADMIN_USERNAME, env.ADMIN_PASSWORD_HASH]))
    .digest("hex");
}

export async function verifyCredentials(
  credentials: { username?: unknown; password?: unknown } | undefined,
  env: Environment,
) {
  if (
    typeof credentials?.username !== "string" || credentials.username.length > 64 ||
    typeof credentials.password !== "string" || credentials.password.length > 1024 ||
    !env.ADMIN_USERNAME || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH || "")
  ) return false;
  const [, salt, stored] = env.ADMIN_PASSWORD_HASH!.split(":");
  const derived = await new Promise<Buffer>((resolve, reject) =>
    scrypt(credentials.password as string, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key)),
  );
  // Perform the expensive comparison even when the username is incorrect.
  const passwordMatches = timingSafeEqual(derived, Buffer.from(stored, "hex"));
  const usernameMatches = timingSafeEqual(
    createHash("sha256").update(credentials.username).digest(),
    createHash("sha256").update(env.ADMIN_USERNAME).digest(),
  );
  return passwordMatches && usernameMatches;
}

export function createLoginLimiter() {
  let starts: number[] = [];
  return (now = Date.now()) => {
    starts = starts.filter((time) => now - time < 60_000);
    if (starts.length >= 5) return false;
    starts.push(now);
    return true;
  };
}

// One budget for the single admin account, not a spoofable client IP/username.
// Kept across hot reloads; each server instance has its own budget.
const runtime = globalThis as typeof globalThis & { adminLoginLimiter?: ReturnType<typeof createLoginLimiter> };
export const takeLoginAttempt = runtime.adminLoginLimiter ??= createLoginLimiter();
