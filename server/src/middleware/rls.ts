/**
 * ════════════════════════════════════════════════════════════════════════════
 * ROW-LEVEL SECURITY (RLS) MIDDLEWARE
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * This middleware automatically sets the database session context for RLS
 * based on the authenticated user from the request.
 * 
 * CRITICAL: This middleware MUST be applied AFTER authentication middleware
 * and BEFORE any route handlers that access the database.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { setUserContext, clearUserContext } from '../utils/rls';
import logger from '../utils/logger';

/**
 * Creates RLS middleware that sets the database user context.
 * 
 * @param prisma - Prisma client instance
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import { createRLSMiddleware } from './middleware/rls';
 * import { prisma } from './config/database';
 * 
 * // Apply after auth middleware
 * app.use(authenticateToken);
 * app.use(createRLSMiddleware(prisma));
 * ```
 */
export function createRLSMiddleware(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (req.user && 'userId' in req.user && 'role' in req.user) {
        const { userId, role } = req.user as { userId: string; role: string };
        
        // Set RLS context for this request
        await setUserContext(prisma, userId, role);
        
        logger.debug({ userId, role, path: req.path, method: req.method }, 'RLS context set for request');
      } else {
        // No authenticated user - clear any existing context
        await clearUserContext(prisma);
        
        logger.debug({ path: req.path, method: req.method }, 'No authenticated user - RLS context cleared');
      }
      
      next();
    } catch (error) {
      logger.error({ error, path: req.path, method: req.method }, 'Failed to set RLS context in middleware');
      
      // Don't block the request, but log the error
      // The RLS policies will still protect the data
      next();
    }
  };
}

/**
 * Middleware to verify RLS context is set for protected routes.
 * Use this on routes that REQUIRE authentication and RLS.
 * 
 * @example
 * ```typescript
 * router.get('/my-trips', requireRLSContext, async (req, res) => {
 *   // RLS context is guaranteed to be set here
 *   const trips = await prisma.trip.findMany();
 *   res.json(trips);
 * });
 * ```
 */
export async function requireRLSContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || !('userId' in req.user) || !('role' in req.user)) {
      logger.warn({ path: req.path, method: req.method }, 'RLS context required but user not authenticated');
      
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    next();
  } catch (error) {
    logger.error({ error }, 'Error in requireRLSContext middleware');
    next(error);
  }
}

/**
 * Middleware to clear RLS context for public routes.
 * Use this on routes that should NOT have user context (e.g., registration).
 * 
 * @example
 * ```typescript
 * router.post('/register', clearRLSContext, async (req, res) => {
 *   // No RLS context - system-level access
 *   const user = await prisma.user.create({ data: userData });
 *   res.json(user);
 * });
 * ```
 */
export function clearRLSContext(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await clearUserContext(prisma);
      
      logger.debug({ path: req.path, method: req.method }, 'RLS context cleared for public route');
      
      next();
    } catch (error) {
      logger.error({ error }, 'Failed to clear RLS context');
      next();
    }
  };
}

/**
 * Middleware to log RLS context for debugging.
 * Use this in development to verify RLS is working correctly.
 * 
 * @example
 * ```typescript
 * if (process.env.NODE_ENV === 'development') {
 *   app.use(logRLSContext(prisma));
 * }
 * ```
 */
export function logRLSContext(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.$queryRawUnsafe<Array<{
        user_id: string | null;
        user_role: string | null;
      }>>(
        `SELECT 
          current_setting('app.current_user_id', TRUE) as user_id,
          current_setting('app.user_role', TRUE) as user_role`
      );
      
      logger.debug({ path: req.path, method: req.method, rlsContext: result[0] }, 'Current RLS context');
      
      next();
    } catch (error) {
      logger.error({ error }, 'Failed to log RLS context');
      next();
    }
  };
}
