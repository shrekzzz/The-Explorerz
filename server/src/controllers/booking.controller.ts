import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { CreateBookingInput, BookingQuery } from '../validators/booking.schema.js';
import { sendBookingConfirmationEmail } from '../services/email.service.js';

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query as any) as BookingQuery;
    const { status, sortBy, sortOrder } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const isAdmin = ['SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
    const where: any = {};

    // Non-admins can only see their own bookings
    if (!isAdmin) {
      where.userId = req.user!.userId;
    }
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          package: { select: { title: true, category: true, duration: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: (req.params.id as string) },
      include: {
        package: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    // Check ownership
    const isAdmin = ['SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
    if (booking.userId !== req.user?.userId && !isAdmin) {
      throw new ForbiddenError('Access denied');
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateBookingInput;

    // Verify package exists and is available
    const pkg = await prisma.package.findUnique({ where: { id: data.packageId } });
    if (!pkg) throw new NotFoundError('Package not found');
    if (pkg.status !== 'AVAILABLE') throw new ForbiddenError('Package is not available for booking');

    const totalAmount = Number(pkg.price) * data.travelers;

    const booking = await prisma.booking.create({
      data: {
        userId: req.user!.userId,
        packageId: data.packageId,
        travelers: data.travelers,
        travelDate: new Date(data.travelDate),
        contactInfo: data.contactInfo,
        totalAmount,
      },
      include: { package: { select: { title: true } } },
    });

    // Send confirmation email (fire-and-forget)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (user) {
      sendBookingConfirmationEmail(
        user.email,
        user.firstName,
        pkg.title,
        booking.id,
        data.travelDate,
        data.travelers,
        totalAmount
      ).catch(() => {});
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: (req.params.id as string) } });
    if (!booking) throw new NotFoundError('Booking not found');

    const { status } = req.body;

    // Users can only cancel their own bookings
    const isAdmin = ['SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
    if (!isAdmin && booking.userId !== req.user?.userId) {
      throw new ForbiddenError('Access denied');
    }
    if (!isAdmin && status !== 'CANCELLED') {
      throw new ForbiddenError('You can only cancel bookings');
    }

    const updated = await prisma.booking.update({
      where: { id: (req.params.id as string) },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
