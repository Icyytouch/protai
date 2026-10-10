import { createAdminSupabaseClient } from './supabase-admin';

/**
 * Distributed rate limiter backed by Postgres (rate_limits table).
 * Every serverless instance shares the same counters, so the limit holds
 * globally — unlike the old in-memory version. One RPC round-trip per call.
 */

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60_000;

export async function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  try {
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
    const db = createAdminSupabaseClient();
    const { data, error } = await db.rpc('rate_limit_hit', {
      p_bucket_key: key,
      p_window_start: windowStart,
    });
    if (error || typeof data !== 'number') {
      // Fail open on DB errors: never block legitimate traffic because
      // the limiter itself is down. Logged server-side.
      console.error('[rate-limit] rpc failed, failing open:', error?.message);
      return { ok: true, retryAfterSec: 0 };
    }
    if (data > limit) {
      const retryAfterSec = Math.ceil((Math.floor(now / windowMs) * windowMs + windowMs - now) / 1000);
      return { ok: false, retryAfterSec };
    }
    return { ok: true, retryAfterSec: 0 };
  } catch (err) {
    console.error('[rate-limit] unexpected error, failing open:', err);
    return { ok: true, retryAfterSec: 0 };
  }
}
