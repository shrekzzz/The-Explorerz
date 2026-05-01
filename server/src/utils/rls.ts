/**
 * ════════════════════════════════════════════════════════════════════════════
 * ROW-LEVEL SECURITY (RLS) UTILITIES
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * This module provides utilities for setting the database session context
 * required for Row-Level Security policies to work correctly.
 * 
 * CRITICAL: All authenticated database operations MUST use these utilities
 * to ensure RLS policies are enforced at the database level.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Sets the current user context in the database session.
 * This MUST be called before any database operations that require RLS.
 * 
 * @param prisma - Prisma client instance
 * @param userId - The authenticated user's ID
 * @param userRole - The authenticated user's role
 * 
 * @example
 * ```typescript
 * await setUserContext(prisma, req.user.userId, req.user.role);
 * const trips = await prisma.trip.findMany(); // RLS automatically enforced
 * ```
 */
export async function setUserContext(
  prisma: PrismaClient,
  userId: string,
  userRole: string
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${userId}'`
    );
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.user_role = '${userRole}'`
    );
    
    logger.debug({ userId, userRole }, 'RLS context set');
  } catch (error) {
    logger.error({ error, userId, userRole }, 'Failed to set RLS context');
    throw new Error('Failed to set database security context');
  }
}

/**
 * Clears the user context from the database session.
 * Useful for testing or when switching contexts.
 * 
 * @param prisma - Prisma client instance
 */
export async function clearUserContext(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe('RESET app.current_user_id');
    await prisma.$executeRawUnsafe('RESET app.user_role');
    
    logger.debug('RLS context cleared');
  } catch (error) {
    logger.error({ error }, 'Failed to clear RLS context');
  }
}

/**
 * Executes a database operation with the specified user context.
 * Automatically sets and clears the context using a transaction.
 * 
 * @param prisma - Prisma client instance
 * @param userId - The authenticated user's ID
 * @param userRole - The authenticated user's role
 * @param operation - The database operation to execute
 * @returns The result of the operation
 * 
 * @example
 * ```typescript
 * const trips = await withUserContext(
 *   prisma,
 *   req.user.userId,
 *   req.user.role,
 *   async (tx) => {
 *     return tx.trip.findMany();
 *   }
 * );
 * ```
 */
export async function withUserContext<T>(
  prisma: PrismaClient,
  userId: string,
  userRole: string,
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set the user context for this transaction
    await setUserContext(tx as PrismaClient, userId, userRole);
    
    // Execute the operation
    const result = await operation(tx as PrismaClient);
    
    // Context is automatically cleared when transaction ends
    return result;
  });
}

/**
 * Executes a database operation without user context (system operations).
 * Use this for operations that should bypass RLS, such as:
 * - User registration
 * - Password reset
 * - System maintenance tasks
 * 
 * WARNING: Use with extreme caution. Most operations should use withUserContext.
 * 
 * @param prisma - Prisma client instance
 * @param operation - The database operation to execute
 * @returns The result of the operation
 * 
 * @example
 * ```typescript
 * const user = await withSystemContext(prisma, async (tx) => {
 *   return tx.user.create({
 *     data: { email, passwordHash, firstName, lastName }
 *   });
 * });
 * ```
 */
export async function withSystemContext<T>(
  prisma: PrismaClient,
  operation: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Clear any existing context to ensure system-level access
    await clearUserContext(tx as PrismaClient);
    
    // Execute the operation
    return await operation(tx as PrismaClient);
  });
}

/**
 * Middleware helper to extract user context from request.
 * Use this in Express middleware to automatically set RLS context.
 * 
 * @param req - Express request object with user property
 * @param prisma - Prisma client instance
 * 
 * @example
 * ```typescript
 * app.use(async (req, res, next) => {
 *   if (req.user) {
 *     await setRLSFromRequest(req, prisma);
 *   }
 *   next();
 * });
 * ```
 */
export async function setRLSFromRequest(
  req: any,
  prisma: PrismaClient
): Promise<void> {
  if (req.user && req.user.userId && req.user.role) {
    await setUserContext(prisma, req.user.userId, req.user.role);
  }
}

/**
 * Type guard to check if RLS context is set.
 * Useful for debugging and ensuring security policies are active.
 * 
 * @param prisma - Prisma client instance
 * @returns True if user context is set, false otherwise
 */
export async function isRLSContextSet(prisma: PrismaClient): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ current_user_id: string | null }>>(
      "SELECT current_setting('app.current_user_id', TRUE) as current_user_id"
    );
    
    return result[0]?.current_user_id !== null && result[0]?.current_user_id !== '';
  } catch (error) {
    logger.error({ error }, 'Failed to check RLS context');
    return false;
  }
}

/**
 * Gets the current RLS context information.
 * Useful for debugging and logging.
 * 
 * @param prisma - Prisma client instance
 * @returns Object containing userId and userRole, or null if not set
 */
export async function getRLSContext(
  prisma: PrismaClient
): Promise<{ userId: string; userRole: string } | null> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{
      user_id: string | null;
      user_role: string | null;
    }>>(
      `SELECT 
        current_setting('app.current_user_id', TRUE) as user_id,
        current_setting('app.user_role', TRUE) as user_role`
    );
    
    const userId = result[0]?.user_id;
    const userRole = result[0]?.user_role;
    
    if (userId && userRole) {
      return { userId, userRole };
    }
    
    return null;
  } catch (error) {
    logger.error({ error }, 'Failed to get RLS context');
    return null;
  }
}
