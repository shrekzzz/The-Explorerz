import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

interface AuditData {
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit logging middleware factory.
 * Creates a middleware that logs the action after it completes.
 */
export function auditLog(data: AuditData) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Hook into response finish to log after the request completes
    res.on('finish', async () => {
      // Only log successful operations (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId || null,
              action: data.action,
              resource: data.resource,
              resourceId: data.resourceId || (req.params.id as string) || null,
              metadata: {
                ...data.metadata,
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                userAgent: req.headers['user-agent'],
              },
              ipAddress: (req.ip as string | null | undefined) ?? null,
            },
          });
        } catch (err) {
          logger.error({ err }, 'Failed to create audit log');
        }
      }
    });

    next();
  };
}

/**
 * Log an audit event directly (not as middleware).
 */
export async function createAuditEntry(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, any>,
  ipAddress: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata,
        ipAddress,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create audit log entry');
  }
}
