import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Redis Configuration for Upstash
 * 
 * Upstash is a serverless Redis service optimized for:
 * - Serverless/edge deployments
 * - Pay-per-request pricing
 * - Global low-latency
 * - TLS by default
 * 
 * Configuration optimized for Upstash:
 * - TLS enabled
 * - Connection pooling
 * - Automatic reconnection
 * - Graceful error handling
 */

// Check if using Upstash (URL contains upstash.io)
const isUpstash = env.REDIS_URL?.includes('upstash.io');

export const redis = new Redis(env.REDIS_URL, {
  // Upstash-specific optimizations
  family: 6, // Use IPv6 if available (Upstash supports both)
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Connection pool settings
  lazyConnect: true,
  keepAlive: 30000, // Keep connection alive for 30s
  
  // Retry strategy
  retryStrategy(times) {
    if (times > 10) {
      logger.error('Redis max retries exceeded');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect on READONLY errors (Upstash failover)
      return true;
    }
    return false;
  },
  
  // TLS configuration (Upstash uses TLS by default)
  tls: isUpstash ? {
    rejectUnauthorized: true, // Verify TLS certificates
  } : undefined,
  
  // Command timeout
  commandTimeout: 5000, // 5 seconds
});

// Connection events
redis.on('connect', () => {
  logger.info({
    provider: isUpstash ? 'Upstash' : 'Redis',
    url: env.REDIS_URL?.replace(/:[^:]*@/, ':****@'), // Hide password in logs
  }, '✅ Redis connected');
});

redis.on('ready', () => {
  logger.info('✅ Redis ready to accept commands');
});

redis.on('error', (err) => {
  logger.error({ 
    err,
    provider: isUpstash ? 'Upstash' : 'Redis',
  }, '❌ Redis connection error');
});

redis.on('close', () => {
  logger.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', (delay) => {
  logger.info({ delay }, '🔄 Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing Redis connection...');
  await redis.quit();
});

export default redis;
