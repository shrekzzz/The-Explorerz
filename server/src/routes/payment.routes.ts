import { Router } from 'express';
import { initiatePayment, verifyPaymentHandler, handleRefund } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { initiatePaymentSchema, verifyPaymentSchema } from '../validators/payment.schema.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

// User initiates payment
router.post('/initiate',
  authenticate,
  validateBody(initiatePaymentSchema),
  initiatePayment
);

// User verifies payment after Razorpay callback
router.post('/verify',
  authenticate,
  validateBody(verifyPaymentSchema),
  verifyPaymentHandler
);

// Admin refunds a payment
router.post('/refund/:bookingId',
  authenticate,
  requireRole('SUPERADMIN'),
  auditLog({ action: 'PAYMENT_REFUND', resource: 'booking' }),
  handleRefund
);

export default router;
