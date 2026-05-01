import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import { Express, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Generate CSP nonce for inline scripts.
 * This prevents XSS by only allowing scripts with the correct nonce.
 */
export function cspNonce(req: Request, res: Response, next: NextFunction): void {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
}

/**
 * Apply all security middleware to the Express app.
 */
export function applySecurityMiddleware(app: Express): void {
  // ─── CSP Nonce Generation ─────────────
  app.use(cspNonce);

  // ─── Helmet — Security Headers ────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            (req, res) => `'nonce-${(res as any).locals.nonce}'`, // Dynamic nonce
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com', 'blob:'],
          connectSrc: ["'self'", ...env.CORS_ORIGINS.split(',')],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow loading cross-origin images
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,          // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true,    // nosniff
      xFrameOptions: { action: 'deny' },
    })
  );

  // ─── CORS — Whitelist Origins ─────────
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 86400, // Preflight cache 24h
    })
  );

  // ─── Disable X-Powered-By ────────────
  app.disable('x-powered-by');

  // ─── Trust first proxy (for rate limiting behind Nginx) ─────
  app.set('trust proxy', 1);
}
