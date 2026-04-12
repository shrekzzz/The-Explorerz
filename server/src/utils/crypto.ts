import { randomBytes, createHash } from 'crypto';

/**
 * Generate a cryptographically secure random token.
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash a token for safe storage (e.g., share tokens, reset tokens).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a short, URL-safe share token.
 */
export function generateShareToken(): string {
  return randomBytes(16).toString('base64url');
}
