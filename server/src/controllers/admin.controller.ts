import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { getAuditLogs } from '../services/audit.service.js';

const qs = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalPackages,
      totalTrips,
      totalBookings,
      totalEnquiries,
      totalConsentForms,
      recentBookings,
      bookingsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.package.count(),
      prisma.trip.count(),
      prisma.booking.count(),
      prisma.enquiry.count(),
      prisma.consentForm.count(),
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
        stats: { totalUsers, totalPackages, totalTrips, totalBookings, totalEnquiries, totalConsentForms },
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
    const page = Number((req.query as any).page) || 1;
    const limit = Math.min(Number((req.query as any).limit) || 20, 50);
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
      where: { id: (req.params.id as string) },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'Email already exists' } });
      return;
    }

    const argon2 = await import('argon2');
    const passwordHash = await argon2.default.hash(password, {
      type: argon2.default.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: role || 'USER',
        isEmailVerified: true,
        isActive: true,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req.params.id as string) } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: (req.params.id as string) },
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
      page: Number((req.query as any).page) || 1,
      limit: Math.min(Number((req.query as any).limit) || 20, 50),
      userId: qs((req.query as any).userId),
      action: qs((req.query as any).action),
      resource: qs((req.query as any).resource),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function listAllTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number((req.query as any).page) || 1;
    const limit = Math.min(Number((req.query as any).limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = qs((req.query as any).search);

    const where: any = {};
    if (search) {
      where.destination = { contains: search, mode: 'insensitive' };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          itinerary: {
            include: { activities: true },
            orderBy: { dayNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({
      success: true,
      data: trips,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
