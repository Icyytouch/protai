import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const KEY_PREFIX = 'ptk_';
const RANDOM_CHARS = 32;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Generate a new API key: `ptk_` + 32 random alphanumeric chars. */
export function generateApiKey(): string {
  const bytes = randomBytes(RANDOM_CHARS);
  let body = '';
  for (let i = 0; i < RANDOM_CHARS; i++) {
    body += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${KEY_PREFIX}${body}`;
}

/** SHA-256 hex digest of a key. Only the hash is stored in the database. */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/** Short display prefix, e.g. "ptk_a1B2c3" — safe to show in the dashboard. */
export function keyDisplayPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX.length + 6);
}

/** Constant-time comparison of a candidate key against a stored hash. */
export function verifyApiKey(candidate: string, storedHash: string): boolean {
  const candidateHash = hashApiKey(candidate);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Extract the raw key from an `Authorization: Bearer <key>` header. */
export function extractBearerKey(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const key = match?.[1]?.trim();
  if (!key || !key.startsWith(KEY_PREFIX)) return null;
  return key;
}
