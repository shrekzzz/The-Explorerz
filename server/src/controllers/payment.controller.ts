import { Request, Response, NextFunction } from 'express';
import { createPaymentOrder, verifyPayment, refundPayment } from '../services/payment.service.js';
import { logAuditEvent } from '../services/audit.service.js';

export async function initiatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId, amount, currency } = req.body;

    const order = await createPaymentOrder(bookingId, amount, currency);

    await logAuditEvent(req.user!.userId, 'PAYMENT_INITIATED', 'booking', bookingId, {
      orderId: order.orderId,
      amount,
    }, req.ip);

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    const result = await verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId);

    if (result.verified) {
      await logAuditEvent(req.user!.userId, 'PAYMENT_VERIFIED', 'booking', bookingId, {
        paymentId: razorpayPaymentId,
      }, req.ip);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params;

    await refundPayment(bookingId);

    await logAuditEvent(req.user!.userId, 'PAYMENT_REFUNDED', 'booking', bookingId, {}, req.ip);

    res.json({ success: true, message: 'Refund initiated' });
  } catch (err) {
    next(err);
  }
}
