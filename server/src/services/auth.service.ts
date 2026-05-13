import argon2 from 'argon2';
import prisma from '../config/database.js';
import redis from '../config/redis.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from '../utils/jwt.js';
import { generateSecureToken } from '../utils/crypto.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors.js';
import { getPermissionsForRole } from '../middleware/rbac.js';
import { env } from '../config/env.js';
import { LoginInput } from '../validators/auth.schema.js';
import { isAccountLocked, recordFailedLogin, clearFailedLogins, getLockoutTTL } from './account.service.js';
import logger from '../utils/logger.js';

async function safeRedisSetex(key: string, ttl: number, value: string): Promise<void> {
  try {
    await redis.setex(key, ttl, value);
  } catch (err) {
    logger.warn({ err, key }, 'Redis unavailable, session cache skipped');
  }
}

async function safeRedisDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, 'Redis unavailable, delete skipped');
  }
}


// ─── Types ──────────────────────────────

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

// ─── Registration Removed ───────────────
// Public registration has been removed — admin-only auth flow
// Admins can create users via admin.controller.ts → createUser

// ─── Login ──────────────────────────────

export async function loginUser(
  data: LoginInput,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  // Check account lockout
  const locked = await isAccountLocked(data.email);
  if (locked) {
    const ttl = await getLockoutTTL(data.email);
    const minutes = Math.ceil(ttl / 60);
    throw new ForbiddenError(`Account is locked due to too many failed attempts. Try again in ${minutes} minutes.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    await recordFailedLogin(data.email);
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account has been deactivated');
  }

  // Verify password
  const isValid = await argon2.verify(user.passwordHash, data.password);
  if (!isValid) {
    const isNowLocked = await recordFailedLogin(data.email);
    if (isNowLocked) {
      throw new ForbiddenError('Account has been locked due to too many failed attempts. Try again in 30 minutes.');
    }
    throw new UnauthorizedError('Invalid email or password');
  }

  // Clear failed login attempts on success
  await clearFailedLogins(data.email);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const tokens = await createSession(user.id, user.role, ipAddress, userAgent);

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: formatUser(user),
    tokens,
  };
}

// ─── Refresh Token ──────────────────────

export async function refreshTokens(
  refreshToken: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthTokens> {
  // Verify the refresh token JWT
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Find the session in DB
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.refreshToken !== refreshToken) {
    // Possible token reuse attack — invalidate all sessions for this user
    if (session) {
      await prisma.session.deleteMany({ where: { userId: session.userId } });
      await safeRedisDel(`sessions:${session.userId}`);
      logger.warn({ userId: session.userId }, 'Potential refresh token reuse attack — all sessions revoked');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new UnauthorizedError('Refresh token expired');
  }

  if (!session.user.isActive) {
    throw new UnauthorizedError('Account has been deactivated');
  }

  // Rotate: delete old session and create new one
  await prisma.session.delete({ where: { id: session.id } });

  const tokens = await createSession(session.userId, session.user.role, ipAddress, userAgent);

  return tokens;
}

// ─── Logout ─────────────────────────────

export async function logoutUser(refreshToken: string): Promise<void> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return; // Silently ignore invalid tokens on logout
  }

  await prisma.session.deleteMany({
    where: { id: payload.sessionId },
  });

  await safeRedisDel(`sessions:${payload.userId}`);
}

/**
 * Logout from all devices.
 */
export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  await safeRedisDel(`sessions:${userId}`);
}

// ─── Helpers ────────────────────────────

async function createSession(
  userId: string,
  role: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<AuthTokens> {
  const permissions = getPermissionsForRole(role);
  const sessionId = generateSecureToken(16);

  const accessToken = generateAccessToken({ userId, role, permissions });
  const newRefreshToken = generateRefreshToken({ userId, sessionId });

  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRY));

  // Store session in DB
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshToken: newRefreshToken,
      ipAddress,
      userAgent: userAgent?.substring(0, 500) || null,
      expiresAt,
    },
  });

  // Cache in Redis for quick validation (optional)
  await safeRedisSetex(
    `sessions:${userId}:${sessionId}`,
    Math.floor(parseDuration(env.JWT_REFRESH_EXPIRY) / 1000),
    'active'
  );

  return { accessToken, refreshToken: newRefreshToken };
}


function formatUser(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
  };
}
