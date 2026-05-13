import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// ─── Razorpay Client ────────────────────

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestError('Payment gateway not configured');
    }
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

// ─── Create Order ───────────────────────

export async function createPaymentOrder(
  bookingId: string,
  amount: number,
  currency: string = 'INR'
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { package: { select: { title: true } }, user: { select: { email: true, firstName: true } } },
  });

  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.status !== 'PENDING') throw new BadRequestError('Booking is not in pending status');

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay expects paise
    currency,
    receipt: bookingId,
    notes: {
      bookingId,
      packageTitle: booking.package.title,
      userEmail: booking.user.email,
    },
  });

  // Store order ID on booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentId: order.id },
  });

  logger.info({ bookingId, orderId: order.id, amount }, 'Payment order created');

  return {
    orderId: order.id,
    amount,
    currency,
    keyId: process.env.RAZORPAY_KEY_ID!,
  };
}

// ─── Verify Payment ─────────────────────

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  bookingId: string
): Promise<{ verified: boolean; bookingId: string }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');

  // Verify signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpaySignature;

  if (isValid) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentId: razorpayPaymentId,
      },
    });

    logger.info({ bookingId, paymentId: razorpayPaymentId }, 'Payment verified — booking confirmed');
  } else {
    logger.warn({ bookingId, razorpayOrderId }, 'Payment signature verification failed');
  }

  return { verified: isValid, bookingId };
}

// ─── Refund Payment ─────────────────────

export async function refundPayment(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking not found');
  if (!booking.paymentId) throw new BadRequestError('No payment found for this booking');

  const razorpay = getRazorpay();

  await razorpay.payments.refund(booking.paymentId, {
    amount: Math.round(Number(booking.totalAmount) * 100),
    speed: 'normal',
    notes: { bookingId, reason: 'Booking cancelled' },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'REFUNDED' },
  });

  logger.info({ bookingId, paymentId: booking.paymentId }, 'Payment refunded');
}
