import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// ─── Idempotency Middleware ────────────────

interface IdempotencyResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
}

/**
 * Idempotency middleware to prevent duplicate requests.
 * Requires client to send "Idempotency-Key" header.
 * 
 * Usage:
 * router.post('/bookings', idempotent, createBooking);
 * router.post('/payments/initiate', idempotent, initiatePayment);
 */
export function idempotent(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  // Idempotency key is required for POST/PUT/PATCH/DELETE
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!idempotencyKey) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required for this operation',
        },
      });
      return;
    }

    // Validate idempotency key format (UUID or similar)
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be 16-128 alphanumeric characters',
        },
      });
      return;
    }
  }

  // Check if we've seen this idempotency key before
  const cacheKey = `idempotency:${req.user?.userId || 'anonymous'}:${idempotencyKey}`;

  redis
    .get(cacheKey)
    .then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response
        const cached: IdempotencyResponse = JSON.parse(cachedResponse);
        logger.info(
          { idempotencyKey, userId: req.user?.userId },
          'Idempotent request - returning cached response'
        );

        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        res.status(cached.statusCode).json(cached.body);
        return;
      }

      // First time seeing this key - intercept response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;

      // Intercept status() calls
      res.status = function (code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Intercept json() calls
      res.json = function (body: any) {
        // Only cache successful responses (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          const responseToCache: IdempotencyResponse = {
            statusCode,
            body,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Cached': 'false',
            },
          };

          // Cache for 24 hours
          redis
            .setex(cacheKey, 24 * 60 * 60, JSON.stringify(responseToCache))
            .then(() => {
              logger.info(
                { idempotencyKey, userId: req.user?.userId },
                'Cached idempotent response'
              );
            })
            .catch((err) => {
              logger.error({ err, idempotencyKey }, 'Failed to cache idempotent response');
            });

          res.setHeader('X-Idempotency-Cached', 'false');
        }

        return originalJson(body);
      };

      next();
    })
    .catch((err) => {
      logger.error({ err, idempotencyKey }, 'Failed to check idempotency cache');
      // Continue without idempotency check on Redis error
      next();
    });
}

/**
 * Generate a secure idempotency key (for client-side use).
 * Returns a URL-safe random string.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Clear idempotency cache for a specific key (admin use).
 */
export async function clearIdempotencyKey(userId: string, key: string): Promise<void> {
  const cacheKey = `idempotency:${userId}:${key}`;
  await redis.del(cacheKey);
  logger.info({ userId, key }, 'Cleared idempotency key');
}

/**
 * Clear all idempotency keys for a user (admin use).
 */
export async function clearUserIdempotencyKeys(userId: string): Promise<void> {
  const pattern = `idempotency:${userId}:*`;
  let cursor = '0';
  let deletedCount = 0;

  do {
    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = newCursor;

    if (keys.length > 0) {
      await redis.del(...keys);
      deletedCount += keys.length;
    }
  } while (cursor !== '0');

  logger.info({ userId, deletedCount }, 'Cleared user idempotency keys');
}
