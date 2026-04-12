import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Create an audit log entry.
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string | null = null,
  metadata: Record<string, any> = {},
  ipAddress: string | null = null
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
    logger.error({ err }, 'Failed to write audit log');
  }
}

/**
 * Query audit logs with pagination and filtering.
 */
export async function getAuditLogs(options: {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { page, limit, userId, action, resource, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
