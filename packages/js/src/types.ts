/**
 * Options for the ProtAI client.
 */
export interface ProtAIOptions {
  /**
   * API base URL. Defaults to `https://protai.co.uk`.
   * Point at `http://localhost:3000` for local development.
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds. Defaults to 10000 (10s).
   */
  timeoutMs?: number;
}

/**
 * Result of `check()` — call before spending tokens on a user.
 */
export interface CheckResult {
  allowed: boolean;
  balance: number;
  quota: number;
  /** Present only when `allowed` is false. */
  reason?: 'insufficient' | 'killed';
}

/**
 * Result of `report()` — call after spending tokens on a user.
 */
export interface ReportResult {
  balance: number;
}

/**
 * Result of `balance()` — current credit state for a user on a meter.
 */
export interface BalanceResult {
  balance: number;
  quota: number;
  /** Billing period, `YYYY-MM`. */
  period: string;
}

/**
 * Machine-readable error codes raised as `ProtAIError.code`.
 */
export type ProtAIErrorCode =
  | 'missing_api_key'
  | 'invalid_argument'
  | 'network_error'
  | 'timeout'
  | 'unauthorized' // HTTP 401 — bad or revoked API key
  | 'rate_limited' // HTTP 429 — 100 req/min per key
  | 'not_found' // HTTP 404 — wrong baseUrl most likely
  | 'bad_request' // HTTP 400 — invalid input
  | 'server_error' // HTTP 5xx
  | 'invalid_response'; // non-JSON or unexpected body
