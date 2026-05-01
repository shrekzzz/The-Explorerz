import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import redis from './config/redis.js';
import { initEmailWorker } from './services/email.service.js';

async function main() {
  const app = createApp();

  // Connect to Redis
  try {
    await redis.connect();
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — running without cache');
  }

  // Initialize email worker
  const emailWorker = initEmailWorker();
  logger.info('📧 Email worker initialized');

  // Start server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`📋 Environment: ${env.NODE_ENV}`);
    logger.info(`🏥 Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');
      
      // Close email worker
      await emailWorker.close();
      logger.info('Email worker closed');
      
      try {
        await redis.quit();
        logger.info('Redis disconnected');
      } catch {}

      const { default: prisma } = await import('./config/database.js');
      await prisma.$disconnect();
      logger.info('Database disconnected');

      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled Rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
