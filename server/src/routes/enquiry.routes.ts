import { Router } from 'express';
import { createEnquiry, listEnquiries, updateEnquiryStatus, getEnquiryStats } from '../controllers/enquiry.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createEnquirySchema, updateEnquiryStatusSchema } from '../validators/enquiry.schema.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for enquiry submissions (5 requests per 5 minutes per IP)
const enquiryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many enquiries submitted. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ──────────────────────

router.post('/', enquiryLimiter, validateBody(createEnquirySchema), createEnquiry);

// ─── Admin Routes ───────────────────────

router.get('/', authenticate, requireRole('STAFF', 'SUPERADMIN'), listEnquiries);
router.get('/stats', authenticate, requireRole('STAFF', 'SUPERADMIN'), getEnquiryStats);
router.patch('/:id/status', authenticate, requireRole('STAFF', 'SUPERADMIN'), validateBody(updateEnquiryStatusSchema), updateEnquiryStatus);

export default router;
