import { Router } from 'express';
import { getMe, clerkWebhook } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ─── Clerk-managed auth ─────────────────
// Registration, login, logout, password reset, and email verification
// are all handled by Clerk's hosted UI. The backend only needs:

// 1. Get current user's local DB record (requires Clerk session)
router.get('/me', authenticate, getMe);

// 2. Clerk webhook — syncs user data to local DB
//    Raw body parsing is configured in app.ts for this route
router.post('/webhook', clerkWebhook);

export default router;
