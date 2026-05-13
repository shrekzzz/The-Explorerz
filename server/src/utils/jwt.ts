import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  userId: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

/**
 * Generate an access token (short-lived, 15 min default).
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
    issuer: 'deshyatra-api',
    audience: 'deshyatra-client',
  });
}

/**
 * Generate a refresh token (long-lived, 7 days default).
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
    issuer: 'deshyatra-api',
    audience: 'deshyatra-client',
  });
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'deshyatra-api',
    audience: 'deshyatra-client',
  }) as JwtPayload & AccessTokenPayload;

  return {
    userId: decoded.userId,
    role: decoded.role,
    permissions: decoded.permissions,
  };
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'deshyatra-api',
    audience: 'deshyatra-client',
  }) as JwtPayload & RefreshTokenPayload;

  return {
    userId: decoded.userId,
    sessionId: decoded.sessionId,
  };
}

/**
 * Get expiry duration in milliseconds for a duration string like '15m', '7d'.
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
