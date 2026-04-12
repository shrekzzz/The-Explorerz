import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { getAuditLogs } from '../services/audit.service.js';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalPackages,
      totalTrips,
      totalBookings,
      recentBookings,
      bookingsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.package.count(),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          package: { select: { title: true } },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalPackages, totalTrips, totalBookings },
        recentBookings,
        bookingsByStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { trips: true, bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getAdminAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getAuditLogs({
      page: Number(req.query.page) || 1,
      limit: Math.min(Number(req.query.limit) || 20, 50),
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      resource: req.query.resource as string | undefined,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
