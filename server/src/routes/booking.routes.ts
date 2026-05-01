import { Router } from 'express';
import {
  listBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  createPaymentOrder,
  verifyPayment,
  cancelBooking,
  modifyBooking,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createBookingSchema, updateBookingSchema, bookingQuerySchema } from '../validators/booking.schema.js';
import { auditLog } from '../middleware/audit.js';
import { idempotent } from '../middleware/idempotency.js';

const router = Router();

router.get('/', authenticate, validateQuery(bookingQuerySchema), listBookings);
router.get('/:id', authenticate, getBooking);
router.post('/',
  authenticate,
  idempotent, // Prevent duplicate bookings
  validateBody(createBookingSchema),
  auditLog({ action: 'BOOKING_CREATE', resource: 'booking' }),
  createBooking
);

// Payment endpoints
router.post('/:id/payment/order',
  authenticate,
  auditLog({ action: 'PAYMENT_ORDER_CREATE', resource: 'booking' }),
  createPaymentOrder
);
router.post('/:id/payment/verify',
  authenticate,
  idempotent, // Prevent duplicate payment verification
  auditLog({ action: 'PAYMENT_VERIFY', resource: 'booking' }),
  verifyPayment
);

// Booking management
router.post('/:id/cancel',
  authenticate,
  idempotent, // Prevent duplicate cancellations
  auditLog({ action: 'BOOKING_CANCEL', resource: 'booking' }),
  cancelBooking
);
router.patch('/:id',
  authenticate,
  auditLog({ action: 'BOOKING_MODIFY', resource: 'booking' }),
  modifyBooking
);

// Legacy status update endpoint
router.patch('/:id/status',
  authenticate,
  idempotent, // Prevent duplicate status updates
  validateBody(updateBookingSchema),
  auditLog({ action: 'BOOKING_STATUS_UPDATE', resource: 'booking' }),
  updateBookingStatus
);

export default router;
