import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isDevelopment = env.NODE_ENV !== 'production';
const registerRateLimitWindowMs = 60 * 60 * 1000; // 1 hour
const registerRateLimitMax = isDevelopment ? 20 : 3;

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
 * Registration limiter — more lenient in development, stricter in production.
 */
export const registerLimiter = rateLimit({
  windowMs: registerRateLimitWindowMs,
  max: registerRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'REGISTER_RATE_LIMIT',
      message: isDevelopment
        ? 'Too many registration attempts in development. Please wait a moment and try again.'
        : 'Too many registration attempts. Please try again later.',
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
