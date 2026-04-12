import { Router } from 'express';
import { listBookings, getBooking, createBooking, updateBookingStatus } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createBookingSchema, updateBookingSchema, bookingQuerySchema } from '../validators/booking.schema.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, validateQuery(bookingQuerySchema), listBookings);
router.get('/:id', authenticate, getBooking);
router.post('/',
  authenticate,
  validateBody(createBookingSchema),
  auditLog({ action: 'BOOKING_CREATE', resource: 'booking' }),
  createBooking
);
router.patch('/:id/status',
  authenticate,
  validateBody(updateBookingSchema),
  auditLog({ action: 'BOOKING_STATUS_UPDATE', resource: 'booking' }),
  updateBookingStatus
);

export default router;
