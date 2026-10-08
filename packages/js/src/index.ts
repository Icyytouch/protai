import { ProtAIError } from './errors.js';
import type {
  BalanceResult,
  CheckResult,
  ProtAIOptions,
  ReportResult,
} from './types.js';

const DEFAULT_BASE_URL = 'https://protai.co.uk';
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * ProtAI client — drop-in credit metering for AI apps.
 *
 * ```ts
 * import { ProtAI } from '@protai/sdk';
 *
 * const protai = new ProtAI(process.env.PROTAI_API_KEY!);
 *
 * const { allowed } = await protai.check('user_123', 'tokens', 500);
 * if (!allowed) throw new Error('Out of credits');
 * // ... run your AI call ...
 * await protai.report('user_123', 'tokens', 500);
 * ```
 */
export class ProtAI {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, options: ProtAIOptions = {}) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      throw new ProtAIError(
        'missing_api_key',
        'ProtAI: apiKey is required. Create one in your ProtAI dashboard under Keys.',
      );
    }
    this.apiKey = apiKey.trim();
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private assertUserAndMeter(userId: string, meter: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new ProtAIError('invalid_argument', 'ProtAI: userId must be a non-empty string.');
    }
    if (!meter || typeof meter !== 'string' || meter.trim() === '') {
      throw new ProtAIError('invalid_argument', 'ProtAI: meter must be a non-empty string (the meter slug from your dashboard).');
    }
  }

  private assertUnits(units: number): void {
    if (typeof units !== 'number' || !Number.isFinite(units) || units <= 0) {
      throw new ProtAIError('invalid_argument', 'ProtAI: units must be a positive finite number.');
    }
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (res.status === 401) {
        throw new ProtAIError('unauthorized', 'ProtAI: invalid API key (401). Check the key in your dashboard.', 401);
      }
      if (res.status === 429) {
        throw new ProtAIError(
          'rate_limited',
          'ProtAI: rate limit exceeded — 100 req/min per key (429). Back off and retry.',
          429,
        );
      }
      if (res.status === 404) {
        throw new ProtAIError('not_found', 'ProtAI: endpoint not found (404). Check your baseUrl.', 404);
      }
      if (res.status >= 500) {
        throw new ProtAIError('server_error', `ProtAI: server error (${res.status}). Retry shortly.`, res.status);
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new ProtAIError('invalid_response', 'ProtAI: server returned a non-JSON response.', res.status);
      }

      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as { error: unknown }).error)
            : `Request failed (${res.status}).`;
        throw new ProtAIError('bad_request', `ProtAI: ${msg}`, res.status);
      }

      return data as T;
    } catch (err) {
      if (err instanceof ProtAIError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ProtAIError('timeout', `ProtAI: request timed out after ${this.timeoutMs}ms.`);
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new ProtAIError('network_error', `ProtAI: network error — ${detail}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Check whether a user may spend `units` on `meter`.
   * Call this BEFORE running your AI call.
   *
   * Returns `{ allowed, balance, quota, reason? }`.
   * `reason` is `'insufficient'` when the quota is exhausted and the meter
   * blocks overage, or `'killed'` when the project's kill-switch is on.
   */
  async check(userId: string, meter: string, units = 1): Promise<CheckResult> {
    this.assertUserAndMeter(userId, meter);
    this.assertUnits(units);
    return this.request<CheckResult>('POST', '/api/v1/check', {
      end_user_id: userId,
      meter,
      units,
    });
  }

  /**
   * Deduct `units` from a user's balance on `meter`.
   * Call this AFTER your AI call completes (use actual usage, e.g. tokens).
   */
  async report(userId: string, meter: string, units: number): Promise<ReportResult> {
    this.assertUserAndMeter(userId, meter);
    this.assertUnits(units);
    return this.request<ReportResult>('POST', '/api/v1/report', {
      end_user_id: userId,
      meter,
      units,
    });
  }

  /**
   * Read a user's current balance, quota and billing period for `meter`.
   */
  async balance(userId: string, meter: string): Promise<BalanceResult> {
    this.assertUserAndMeter(userId, meter);
    const qs = new URLSearchParams({ end_user_id: userId, meter });
    return this.request<BalanceResult>('GET', `/api/v1/balance?${qs.toString()}`);
  }
}

export { ProtAIError } from './errors.js';
export type {
  BalanceResult,
  CheckResult,
  ProtAIOptions,
  ProtAIErrorCode,
  ReportResult,
} from './types.js';
