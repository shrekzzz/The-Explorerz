import { Router } from 'express';
import {
  createConsentForm,
  listConsentForms,
  getConsentFormDetails,
  updateConsentFormStatus,
  getConsentFormStats,
} from '../controllers/consent.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createConsentFormSchema, updateConsentFormStatusSchema } from '../validators/consent.schema.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for consent form submissions (3 requests per 10 minutes per IP)
const consentFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many consent forms submitted. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ──────────────────────

router.post('/', consentFormLimiter, validateBody(createConsentFormSchema), createConsentForm);

// ─── Admin Routes ───────────────────────

router.get('/', authenticate, requireRole('STAFF', 'SUPERADMIN'), listConsentForms);
router.get('/stats', authenticate, requireRole('STAFF', 'SUPERADMIN'), getConsentFormStats);
router.get('/:id', authenticate, requireRole('STAFF', 'SUPERADMIN'), getConsentFormDetails);
router.patch('/:id/status', authenticate, requireRole('STAFF', 'SUPERADMIN'), validateBody(updateConsentFormStatusSchema), updateConsentFormStatus);

export default router;
