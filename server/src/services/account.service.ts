import prisma from '../config/database.js';
import redis from '../config/redis.js';
import { generateSecureToken } from '../utils/crypto.js';
import { sendEmail } from './email.service.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import argon2 from 'argon2';
import logger from '../utils/logger.js';

// ─── Email Verification ─────────────────

/**
 * Generate a verification token and send verification email.
 */
export async function sendVerificationEmail(userId: string, email: string, firstName: string): Promise<void> {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store token in Redis
  await redis.setex(`verify:${token}`, 86400, userId); // 24h TTL

  const verifyUrl = `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email — DeshYatra ✉️',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Please verify your email address to activate your DeshYatra account.
            This link will expire in 24 hours.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 14px 36px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">
            If you didn't create a DeshYatra account, please ignore this email.
          </p>
        </div>
        <div style="padding: 20px 30px; background: #f3f4f6; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} DeshYatra. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, verify your email at: ${verifyUrl}`,
  });
}

/**
 * Verify an email token and mark user as verified.
 */
export async function verifyEmail(token: string): Promise<{ email: string }> {
  const userId = await redis.get(`verify:${token}`);
  if (!userId) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });

  // Delete token
  await redis.del(`verify:${token}`);

  logger.info({ userId }, 'Email verified');
  return { email: user.email };
}

// ─── Forgot / Reset Password ────────────

/**
 * Generate a password reset token and send email.
 */
export async function initiatePasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive) return;

  const token = generateSecureToken(32);

  // Store in Redis with 1hr TTL
  await redis.setex(`reset:${token}`, 3600, user.id);

  const resetUrl = `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password — DeshYatra',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px;">Hi ${user.firstName},</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below.
            This link expires in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 36px;
                      border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `Reset your password at: ${resetUrl}. Expires in 1 hour.`,
  });

  logger.info({ userId: user.id }, 'Password reset requested');
}

/**
 * Reset password using a valid token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await redis.get(`reset:${token}`);
  if (!userId) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all sessions (force re-login)
  await prisma.session.deleteMany({ where: { userId } });
  await redis.del(`reset:${token}`);

  // Clear session cache
  const sessionKeys = await redis.keys(`sessions:${userId}:*`);
  if (sessionKeys.length > 0) {
    await redis.del(...sessionKeys);
  }

  logger.info({ userId }, 'Password reset completed');
}

// ─── Account Lockout ────────────────────

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION = 30 * 60; // 30 minutes

/**
 * Record a failed login attempt. Returns true if account is now locked.
 */
export async function recordFailedLogin(email: string): Promise<boolean> {
  const key = `lockout:${email.toLowerCase()}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // Set expiry on first attempt
    await redis.expire(key, LOCKOUT_DURATION);
  }

  if (count >= MAX_FAILED_ATTEMPTS) {
    logger.warn({ email }, `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts`);
    return true;
  }

  return false;
}

/**
 * Check if an account is locked.
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const key = `lockout:${email.toLowerCase()}`;
  const count = await redis.get(key);
  return count !== null && parseInt(count) >= MAX_FAILED_ATTEMPTS;
}

/**
 * Clear failed login attempts (on successful login).
 */
export async function clearFailedLogins(email: string): Promise<void> {
  await redis.del(`lockout:${email.toLowerCase()}`);
}

/**
 * Get remaining lockout time in seconds.
 */
export async function getLockoutTTL(email: string): Promise<number> {
  return await redis.ttl(`lockout:${email.toLowerCase()}`);
}

// ─── Change Password (Authenticated) ───

/**
 * Change password for an authenticated user.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const isValid = await argon2.verify(user.passwordHash, currentPassword);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  logger.info({ userId }, 'Password changed');
}
