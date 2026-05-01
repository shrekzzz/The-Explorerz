import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { CreateBookingInput, BookingQuery } from '../validators/booking.schema.js';
import { queueEmail } from '../services/email.service.js';
import { paramId } from '../utils/params.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as BookingQuery;
    const { page, limit, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const isAdmin = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
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
      where: { id: paramId(req, 'id') },
      include: {
        package: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    // Check ownership
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
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
        status: 'PENDING', // Will be confirmed after payment
      },
      include: { package: { select: { title: true } } },
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: paramId(req, 'id') } });
    if (!booking) throw new NotFoundError('Booking not found');

    const { status } = req.body;

    // Users can only cancel their own bookings
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
    if (!isAdmin && booking.userId !== req.user?.userId) {
      throw new ForbiddenError('Access denied');
    }
    if (!isAdmin && status !== 'CANCELLED') {
      throw new ForbiddenError('You can only cancel bookings');
    }

    const updated = await prisma.booking.update({
      where: { id: paramId(req, 'id') },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function createPaymentOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = paramId(req, 'id');
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true, user: true },
    });

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== req.user!.userId) throw new ForbiddenError('Access denied');
    if (booking.status !== 'PENDING') {
      throw new BadRequestError('Booking is not in pending state');
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Number(booking.totalAmount) * 100, // Convert to paise
      currency: 'INR',
      receipt: booking.id,
      notes: {
        bookingId: booking.id,
        userId: booking.userId,
        packageTitle: booking.package.title,
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = paramId(req, 'id');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestError('Invalid payment signature');
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentId: razorpay_payment_id,
      },
      include: { package: true, user: true },
    });

    // Queue confirmation email
    await queueEmail('booking-confirmation', {
      email: booking.user.email,
      firstName: booking.user.firstName,
      packageTitle: booking.package.title,
      bookingId: booking.id,
      travelDate: booking.travelDate.toISOString().split('T')[0],
      travelers: booking.travelers,
      totalAmount: Number(booking.totalAmount),
    });

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = paramId(req, 'id');
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, package: true },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    const isAdmin = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(req.user?.role || '');
    if (booking.userId !== req.user?.userId && !isAdmin) {
      throw new ForbiddenError('Access denied');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestError('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel completed booking');
    }

    // Check cancellation policy (7 days before travel)
    const daysUntilTravel = Math.ceil(
      (booking.travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilTravel < 7 && !isAdmin) {
      throw new BadRequestError('Cancellation not allowed within 7 days of travel date');
    }

    // Process refund if payment was made
    let refundId: string | undefined;
    if (booking.paymentId && booking.status === 'CONFIRMED') {
      try {
        const refund = await razorpay.payments.refund(booking.paymentId, {
          amount: Number(booking.totalAmount) * 100,
          speed: 'normal',
        });
        refundId = refund.id;
      } catch (err) {
        // Log error but don't fail the cancellation
        console.error('Refund failed:', err);
      }
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: refundId ? 'REFUNDED' : 'CANCELLED',
      },
    });

    res.json({
      success: true,
      data: updated,
      message: refundId ? 'Booking cancelled and refund initiated' : 'Booking cancelled',
    });
  } catch (err) {
    next(err);
  }
}

export async function modifyBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = paramId(req, 'id');
    const { travelDate, travelers } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true },
    });

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== req.user?.userId) throw new ForbiddenError('Access denied');
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestError('Only confirmed bookings can be modified');
    }

    // Check if modification is allowed (at least 14 days before travel)
    const daysUntilTravel = Math.ceil(
      (booking.travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilTravel < 14) {
      throw new BadRequestError('Modifications not allowed within 14 days of travel date');
    }

    // Recalculate amount if travelers changed
    const newAmount = travelers
      ? Number(booking.package.price) * travelers
      : booking.totalAmount;

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        travelDate: travelDate ? new Date(travelDate) : booking.travelDate,
        travelers: travelers || booking.travelers,
        totalAmount: newAmount,
      },
      include: { package: true },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Booking modified successfully',
    });
  } catch (err) {
    next(err);
  }
}
