import express from 'express';
import cookieParser from 'cookie-parser';
import { applySecurityMiddleware } from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/auth.routes.js';
import packageRoutes from './routes/package.routes.js';
import tripRoutes from './routes/trip.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import accountRoutes from './routes/account.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import consentRoutes from './routes/consent.routes.js';
// import paymentRoutes from './routes/payment.routes.js'; // Payment module disabled

export function createApp() {
  const app = express();

  // ─── Security Middleware ──────────────
  applySecurityMiddleware(app);

  // ─── Body Parsing ─────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Request Logging ──────────────────
  app.use(requestLogger);

  // ─── Global Rate Limiter ──────────────
  app.use('/api', globalLimiter);

  // ─── Health Check ─────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ─── API Routes ───────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/consent-forms', consentRoutes);
  // app.use('/api/payments', paymentRoutes); // DISABLED: Payment service paused
  app.use('/api/admin', adminRoutes);

  // ─── Error Handling ───────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
