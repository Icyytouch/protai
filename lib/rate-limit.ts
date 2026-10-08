/**
 * Simple in-memory per-key rate limiter: 100 requests / 60 seconds.
 *
 * NOTE: state lives in this process only. On multi-instance deployments
 * (e.g. several Vercel regions) each instance enforces its own budget.
 * If strict global limiting is ever needed, replace with Upstash Redis.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 20_000;

export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}
