import redis from '../config/redis.js';
import logger from '../utils/logger.js';
import { Request, Response, NextFunction } from 'express';

// ─── Cache Service ──────────────────────

/**
 * Get a cached value by key.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (value) {
      logger.debug({ key }, 'Cache HIT');
      return JSON.parse(value) as T;
    }
    logger.debug({ key }, 'Cache MISS');
    return null;
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed');
    return null;
  }
}

/**
 * Set a value in cache with TTL (seconds).
 */
export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }
}

/**
 * Delete a specific cache key.
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, 'Cache delete failed');
  }
}

/**
 * Delete all keys matching a pattern (e.g. "cache:packages:*").
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug({ pattern, count: keys.length }, 'Cache invalidated');
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn({ err, pattern }, 'Cache pattern invalidation failed');
  }
}

// ─── Cache TTL Constants (seconds) ──────

export const CACHE_TTL = {
  PACKAGE_LIST: 5 * 60,       // 5 minutes
  PACKAGE_DETAIL: 10 * 60,    // 10 minutes
  DASHBOARD_STATS: 2 * 60,    // 2 minutes
  USER_PROFILE: 15 * 60,      // 15 minutes
  SHARED_TRIP: 10 * 60,       // 10 minutes
};

// ─── Cache Key Builders ─────────────────

export function packageListKey(queryHash: string): string {
  return `cache:packages:list:${queryHash}`;
}

export function packageDetailKey(id: string): string {
  return `cache:packages:${id}`;
}

export function dashboardKey(): string {
  return 'cache:admin:dashboard';
}

export function userProfileKey(userId: string): string {
  return `cache:user:${userId}`;
}

export function sharedTripKey(token: string): string {
  return `cache:trip:shared:${token}`;
}

// ─── Cache Invalidation Helpers ─────────

export async function invalidatePackageCache(packageId?: string): Promise<void> {
  await invalidateCachePattern('cache:packages:*');
  await deleteCache(dashboardKey());
  if (packageId) {
    await deleteCache(packageDetailKey(packageId));
  }
}

export async function invalidateBookingCache(): Promise<void> {
  await deleteCache(dashboardKey());
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await deleteCache(userProfileKey(userId));
}

// ─── Express Middleware: Cache Response ──

/**
 * Express middleware factory that caches JSON responses.
 * Usage: router.get('/packages', cacheResponse('packages', 300), listPackages);
 */
export function cacheResponse(prefix: string, ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Build cache key from URL + query params
    const queryHash = Buffer.from(JSON.stringify(req.query)).toString('base64url');
    const key = `cache:${prefix}:${queryHash}`;

    const cached = await getCached<any>(key);
    if (cached) {
      res.json(cached);
      return;
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}
