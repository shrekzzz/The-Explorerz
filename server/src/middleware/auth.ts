import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/express';
import { verifyToken } from '@clerk/backend';
import { UnauthorizedError } from '../utils/errors.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

// ─── Types ──────────────────────────────

export interface ClerkUserPayload {
  userId: string;       // Local DB user ID (UUID)
  clerkId: string;      // Clerk user ID (user_xxx)
  email: string;
  role: string;
  permissions: string[];
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: ClerkUserPayload;
    }
  }
}

// Lazily create a single Clerk backend client
const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

/**
 * Auth middleware — verifies Clerk session tokens from the Authorization header.
 * Resolves the Clerk user ID to the local DB user ID for downstream controllers.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Missing token');
    }

    // Verify the Clerk session token
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      throw new UnauthorizedError('Invalid token — no user ID');
    }

    // Resolve Clerk ID → local DB user
    let localUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, role: true, email: true, isActive: true },
    });

    // Auto-sync: if user doesn't exist locally yet, create from Clerk data
    if (!localUser) {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const role = (clerkUser.publicMetadata?.role as string) || 'USER';

      // Check if there's a legacy user with same email
      const legacyUser = await prisma.user.findUnique({ where: { email } });

      if (legacyUser) {
        // Link legacy account to Clerk
        localUser = await prisma.user.update({
          where: { id: legacyUser.id },
          data: { clerkId: clerkUserId, isEmailVerified: true },
          select: { id: true, role: true, email: true, isActive: true },
        });
      } else {
        // Create new local user
        localUser = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            avatarUrl: clerkUser.imageUrl || null,
            isEmailVerified: true,
            role: role as any,
          },
          select: { id: true, role: true, email: true, isActive: true },
        });
      }

      logger.info({ userId: localUser.id, clerkId: clerkUserId }, 'Auto-synced Clerk user to local DB');
    }

    if (!localUser.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Build permissions from role
    const { getPermissionsForRole } = await import('./rbac.js');
    const permissions = getPermissionsForRole(localUser.role);

    req.user = {
      userId: localUser.id,       // Local DB UUID — used by all controllers
      clerkId: clerkUserId,       // Clerk ID — used for Clerk API calls
      email: localUser.email,
      role: localUser.role,
      permissions,
    };

    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.warn({ err: error }, 'Auth verification failed');
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

/**
 * Optional auth — attaches user if token exists, but doesn't require it.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const payload = await verifyToken(token, {
          secretKey: env.CLERK_SECRET_KEY,
        });
        const clerkUserId = payload.sub;

        if (clerkUserId) {
          const localUser = await prisma.user.findUnique({
            where: { clerkId: clerkUserId },
            select: { id: true, role: true, email: true, isActive: true },
          });

          if (localUser && localUser.isActive) {
            const { getPermissionsForRole } = await import('./rbac.js');
            req.user = {
              userId: localUser.id,
              clerkId: clerkUserId,
              email: localUser.email,
              role: localUser.role,
              permissions: getPermissionsForRole(localUser.role),
            };
          }
        }
      }
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}
