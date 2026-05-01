import { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { syncClerkUser, deleteClerkUser, getUserByClerkId } from '../services/auth.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

// ─── GET /api/auth/me ───────────────────
// Returns the local DB user record for the authenticated Clerk user.

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // req.user.clerkId is the Clerk user ID (set by auth middleware)
    const user = await getUserByClerkId(req.user.clerkId);

    if (!user) {
      // User exists in Clerk but not yet synced to local DB.
      // This can happen if the webhook hasn't fired yet.
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_SYNCED', message: 'User not found in database. Please wait for account sync.' },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account has been deactivated' },
      });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/webhook ─────────────
// Receives Clerk webhook events (user.created, user.updated, user.deleted).
// Verifies the Svix signature before processing.

export async function clerkWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const webhookSecret = env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('CLERK_WEBHOOK_SECRET is not set — rejecting webhook');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Svix headers required for verification
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.warn('Missing Svix headers on webhook request');
      res.status(400).json({ error: 'Missing webhook verification headers' });
      return;
    }

    // Verify the webhook signature using Svix
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      // req.body must be the raw string/buffer for Svix to verify correctly
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      logger.warn({ err }, 'Webhook signature verification failed');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    // Process the verified event
    const eventType = event.type as string;
    const eventData = event.data;

    logger.info({ eventType, clerkId: eventData?.id }, 'Clerk webhook received');

    switch (eventType) {
      case 'user.created':
        await syncClerkUser(eventData);
        await logAuditEvent(null, 'USER_REGISTER', 'user', null, { clerkId: eventData.id }, req.ip);
        break;

      case 'user.updated':
        await syncClerkUser(eventData);
        await logAuditEvent(null, 'USER_UPDATED', 'user', null, { clerkId: eventData.id }, req.ip);
        break;

      case 'user.deleted':
        await deleteClerkUser(eventData.id);
        await logAuditEvent(null, 'USER_DELETED', 'user', null, { clerkId: eventData.id }, req.ip);
        break;

      default:
        logger.debug({ eventType }, 'Unhandled Clerk webhook event');
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}
