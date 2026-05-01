import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { getAuditLogs } from '../services/audit.service.js';
import { paramId } from '../utils/params.js';
import { BookingStatus } from '@prisma/client';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalPackages,
      totalTrips,
      totalBookings,
      recentBookings,
      bookingsByStatus,
      revenueData,
      newUsersThisMonth,
      activePackages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.package.count(),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          package: { select: { title: true, category: true } },
        },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] as BookingStatus[] },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.package.count({
        where: { status: 'AVAILABLE' },
      }),
    ]);

    const totalRevenue = Number(revenueData._sum.totalAmount || 0);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPackages,
          totalTrips,
          totalBookings,
          totalRevenue,
          newUsersThisMonth,
          activePackages,
        },
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
      where: { id: paramId(req, 'id') },
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
    const user = await prisma.user.findUnique({ where: { id: paramId(req, 'id') } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: paramId(req, 'id') },
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

export async function getRevenueAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['CONFIRMED', 'COMPLETED'] as BookingStatus[] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day/week/month
    const grouped = bookings.reduce((acc: any, booking) => {
      let key: string;
      const date = new Date(booking.createdAt);

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!acc[key]) {
        acc[key] = { date: key, revenue: 0, bookings: 0 };
      }

      acc[key].revenue += Number(booking.totalAmount);
      acc[key].bookings += 1;

      return acc;
    }, {});

    const analytics = Object.values(grouped);

    res.json({
      success: true,
      data: {
        analytics,
        summary: {
          totalRevenue: bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0),
          totalBookings: bookings.length,
          averageBookingValue: bookings.length > 0 
            ? bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0) / bookings.length 
            : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPackageAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: { bookings: true, reviews: true },
        },
        bookings: {
          select: { totalAmount: true, status: true },
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] as BookingStatus[] } },
        },
      },
    });

    const analytics = packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      category: pkg.category,
      status: pkg.status,
      price: Number(pkg.price),
      totalBookings: pkg._count.bookings,
      totalReviews: pkg._count.reviews,
      totalRevenue: pkg.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0),
      averageRating: Number(pkg.rating),
      conversionRate: pkg.reviewCount > 0 ? (pkg._count.bookings / pkg.reviewCount) * 100 : 0,
    }));

    // Sort by revenue
    analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId ? paramId(req, 'userId') : undefined;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const where = userId ? { userId } : undefined;

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSystemHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const [dbHealth, redisHealth] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => 'healthy').catch(() => 'unhealthy'),
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "users"`.then(() => 'healthy').catch(() => 'unhealthy'),
    ]);

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        status: dbHealth === 'healthy' && redisHealth === 'healthy' ? 'healthy' : 'degraded',
        uptime: Math.floor(uptime),
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        services: {
          database: dbHealth,
          redis: redisHealth,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
