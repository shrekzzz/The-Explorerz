import { Router } from 'express';
import {
  requestVerification,
  confirmVerification,
  forgotPassword,
  handleResetPassword,
  handleChangePassword,
} from '../controllers/account.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.schema.js';
import { passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Email verification
router.post('/verify/request', authenticate, requestVerification);
router.post('/verify/confirm', confirmVerification);

// Forgot / Reset password (public)
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), handleResetPassword);

// Change password (authenticated)
router.post('/change-password', authenticate, validateBody(changePasswordSchema), handleChangePassword);

export default router;
