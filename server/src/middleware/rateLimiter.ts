import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Global API rate limiter — applies to all routes.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // default: 1 minute
  max: env.RATE_LIMIT_MAX_REQUESTS,   // default: 100 per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind reverse proxy, else IP
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
  },
});

/**
 * Strict limiter for login attempts — 5 per 15 minutes.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMIT',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip || 'unknown';
    const email = req.body?.email || '';
    return `${ip}:${email}`;
  },
  skipSuccessfulRequests: true, // Only count failed logins
});

/**
 * Registration limiter — 3 per hour.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'REGISTER_RATE_LIMIT',
      message: 'Too many registration attempts. Please try again later.',
    },
  },
});

/**
 * Password reset limiter — 3 per hour.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT',
      message: 'Too many password reset requests. Please try again later.',
    },
  },
});

/**
 * Upload limiter — 10 per minute.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Too many uploads. Please wait before uploading more files.',
    },
  },
});

/**
 * Token refresh limiter — 10 per minute.
 * Prevents abuse of token refresh endpoint (DoS vector).
 */
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'REFRESH_RATE_LIMIT',
      message: 'Too many refresh requests. Please try again later.',
    },
  },
  keyGenerator: (req) => {
    // Rate limit by IP + user ID if available
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip || 'unknown';
    const userId = (req as any).user?.userId || '';
    return userId ? `${ip}:${userId}` : ip;
  },
});

/**
 * Email verification limiter — 5 per hour.
 * Prevents spam of verification emails.
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EMAIL_VERIFICATION_RATE_LIMIT',
      message: 'Too many verification email requests. Please check your inbox or try again later.',
    },
  },
});

/**
 * Booking creation limiter — 5 per hour.
 * Prevents spam bookings.
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'BOOKING_RATE_LIMIT',
      message: 'Too many booking requests. Please try again later.',
    },
  },
});
