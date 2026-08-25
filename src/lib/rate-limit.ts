type Bucket = { timestamps: number[] };

const windows = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 10;

export function rateLimit(
  key: string,
  maxRequests = MAX_REQUESTS,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = windows.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    windows.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  windows.set(key, bucket);
  return { ok: true };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
