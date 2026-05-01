import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// ─── CSRF Protection ────────────────────────

/**
 * Modern CSRF protection using Double Submit Cookie pattern.
 * More secure than deprecated csurf package.
 * 
 * How it works:
 * 1. Server generates random token and sends it in cookie + response
 * 2. Client includes token in X-CSRF-Token header for mutations
 * 3. Server verifies cookie token matches header token
 * 
 * This prevents CSRF because:
 * - Attacker can't read cookies from other domains (Same-Origin Policy)
 * - Attacker can't set custom headers in simple requests
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate CSRF token and set cookie.
 * Call this on GET requests to provide token to client.
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip if token already exists
  if (req.cookies?.[CSRF_COOKIE_NAME]) {
    next();
    return;
  }

  // Generate new token
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('base64url');

  // Set cookie (httpOnly=false so client can read it)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Also send in response for convenience
  res.locals.csrfToken = token;

  next();
}

/**
 * Verify CSRF token on state-changing requests.
 * Apply to POST/PUT/PATCH/DELETE routes.
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  // Skip for API endpoints using Bearer token auth (not cookie-based)
  // CSRF only affects cookie-based auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Check if tokens exist
  if (!cookieToken || !headerToken) {
    logger.warn(
      {
        method: req.method,
        url: req.url,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
      },
      'CSRF token missing'
    );

    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required for this operation',
      },
    });
    return;
  }

  // Verify tokens match (constant-time comparison to prevent timing attacks)
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn(
      {
        method: req.method,
        url: req.url,
        userId: req.user?.userId,
      },
      'CSRF token mismatch'
    );

    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid CSRF token',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to add CSRF token to response.
 * Use on routes that render forms or return HTML.
 */
export function addCsrfToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[CSRF_COOKIE_NAME];
  if (token) {
    res.locals.csrfToken = token;
  }
  next();
}

/**
 * Get CSRF token from request (for use in controllers).
 */
export function getCsrfToken(req: Request): string | undefined {
  return req.cookies?.[CSRF_COOKIE_NAME];
}

/**
 * Refresh CSRF token (e.g., after login).
 */
export function refreshCsrfToken(req: Request, res: Response): string {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('base64url');

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
}
