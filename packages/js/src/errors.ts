import type { ProtAIErrorCode } from './types.js';

/**
 * Every failure in the ProtAI SDK surfaces as a `ProtAIError`.
 * Inspect `code` for programmatic handling; `message` is human-readable.
 */
export class ProtAIError extends Error {
  readonly code: ProtAIErrorCode;
  /** HTTP status when the error came from the API (undefined for client-side errors). */
  readonly status?: number;

  constructor(code: ProtAIErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'ProtAIError';
    this.code = code;
    this.status = status;
    // Maintain prototype chain for `instanceof` across transpiled targets.
    Object.setPrototypeOf(this, ProtAIError.prototype);
  }
}
