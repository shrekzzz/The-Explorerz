import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Check if Upstash Redis is configured
const useUpstash = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis;

if (useUpstash) {
  // For Upstash, we'll use a mock Redis client since Upstash uses REST API
  // The cache service will handle Upstash REST calls directly
  logger.info('📡 Using Upstash Redis REST API');
  redis = new Redis({
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  // Don't actually connect - cache service will use REST API
} else if (env.REDIS_URL) {
  // Regular Redis connection
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    connectTimeout: 3000,
  });

  redis.on('connect', () => logger.info('✅ Redis connected'));
  redis.on('error', () => { /* suppress — app runs without Redis */ });
} else {
  // No Redis configured - create a dummy client
  logger.warn('⚠️  No Redis configured - caching disabled');
  redis = new Redis({
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
}

export { redis };
export default redis;
