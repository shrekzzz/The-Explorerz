import { Router } from 'express';
import { login, refreshToken, logout, logoutAll, getMe } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.schema.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getMe);

export default router;
