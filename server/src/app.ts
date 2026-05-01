import express from 'express';
import cookieParser from 'cookie-parser';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { createRLSMiddleware, logRLSContext } from './middleware/rls.js';
import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import tripRoutes from './routes/trip.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import prisma from './config/database.js';
import redis from './config/redis.js';

export function createApp() {
  const app = express();

  // ─── Request ID (first, for tracing) ──
  app.use(requestId);

  // ─── Security Middleware ──────────────
  applySecurityMiddleware(app);

  // ─── Raw body for Clerk webhook (before JSON parsing) ──
  app.use('/api/auth/webhook', express.raw({ type: 'application/json' }));

  // ─── Body Parsing ─────────────────────
  app.use(express.json({ limit: '10kb' }));       // Limit JSON body size
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // ─── Request Logging ──────────────────
  app.use(requestLogger);

  // ─── Global Rate Limiter ──────────────
  app.use('/api', globalLimiter);

  // ─── Row-Level Security Context ───────
  // CRITICAL: This must be applied to all API routes to enforce database-level security
  // It sets the user context in the database session based on authenticated user
  app.use('/api', createRLSMiddleware(prisma));
  
  // Log RLS context in development for debugging
  if (process.env.NODE_ENV === 'development') {
    app.use('/api', logRLSContext(prisma));
  }

  // ─── Health Check (unversioned) ───────
  app.get('/api/health', async (_req, res) => {
    const checks: Record<string, string> = {};

    // Database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
    }

    // Redis connectivity
    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
    } catch {
      checks.redis = 'unhealthy';
    }

    const allHealthy = Object.values(checks).every((v) => v === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    });
  });

  // ─── API Version Info ─────────────────
  app.get('/api', (_req, res) => {
    res.json({
      name: 'The-Explorerz API',
      version: '1.0.0',
      currentVersion: 'v1',
      availableVersions: ['v1'],
      documentation: '/api/v1/docs',
      health: '/api/health',
    });
  });

  // ─── API v1 Routes ────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/packages', packageRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/uploads', uploadRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // ─── Legacy Routes (redirect to v1) ───
  // Temporary backwards compatibility - remove after frontend migration
  app.use('/api/auth', (req, res) => res.redirect(308, `/api/v1/auth${req.url}`));
  app.use('/api/packages', (req, res) => res.redirect(308, `/api/v1/packages${req.url}`));
  app.use('/api/trips', (req, res) => res.redirect(308, `/api/v1/trips${req.url}`));
  app.use('/api/bookings', (req, res) => res.redirect(308, `/api/v1/bookings${req.url}`));
  app.use('/api/uploads', (req, res) => res.redirect(308, `/api/v1/uploads${req.url}`));
  app.use('/api/payments', (req, res) => res.redirect(308, `/api/v1/payments${req.url}`));
  app.use('/api/admin', (req, res) => res.redirect(308, `/api/v1/admin${req.url}`));

  // ─── Error Handling ───────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
