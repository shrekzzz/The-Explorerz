import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { queueEmail } from './email.service.js';

// ─── Types ──────────────────────────────

interface ClerkUserData {
  id: string;           // Clerk user ID (e.g. "user_xxx")
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  phone_numbers?: Array<{ phone_number: string }>;
  image_url?: string | null;
  public_metadata?: Record<string, unknown>;
}

interface UserResponse {
  id: string;
  clerkId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

// ─── Sync from Clerk Webhook ────────────

/**
 * Upsert a local user record when Clerk fires `user.created` or `user.updated`.
 * If a user with the same email already exists (legacy pre-Clerk accounts),
 * link them by setting clerkId.
 */
export async function syncClerkUser(data: ClerkUserData): Promise<UserResponse> {
  const email = data.email_addresses[0]?.email_address?.toLowerCase();
  if (!email) {
    throw new Error('Clerk user has no email address');
  }

  const role = (data.public_metadata?.role as string) || 'USER';

  // Try to find by clerkId first, then by email (for legacy migration)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: data.id },
        { email },
      ],
    },
  });

  if (existing) {
    // Update existing user
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId: data.id,
        email,
        firstName: data.first_name || existing.firstName,
        lastName: data.last_name || existing.lastName,
        phone: data.phone_numbers?.[0]?.phone_number || existing.phone,
        avatarUrl: data.image_url || existing.avatarUrl,
        isEmailVerified: true,  // Clerk handles email verification
        lastLoginAt: new Date(),
      },
    });

    logger.info({ userId: updated.id, clerkId: data.id }, 'Clerk user synced (updated)');
    return formatUser(updated);
  }

  // Create new user
  const created = await prisma.user.create({
    data: {
      clerkId: data.id,
      email,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      phone: data.phone_numbers?.[0]?.phone_number || null,
      avatarUrl: data.image_url || null,
      isEmailVerified: true,
      role: role as any,
    },
  });

  logger.info({ userId: created.id, clerkId: data.id }, 'Clerk user synced (created)');

  // Queue welcome email for new users
  await queueEmail('welcome', {
    email: created.email,
    firstName: created.firstName,
  }).catch((err) => {
    logger.error({ err, userId: created.id }, 'Failed to queue welcome email');
  });

  return formatUser(created);
}

/**
 * Deactivate a local user record when Clerk fires `user.deleted`.
 */
export async function deleteClerkUser(clerkId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    logger.warn({ clerkId }, 'Clerk user.deleted — no matching local user');
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: false },
  });

  // Clean up sessions
  await prisma.session.deleteMany({ where: { userId: user.id } });

  logger.info({ userId: user.id, clerkId }, 'Clerk user deactivated');
}

/**
 * Look up a local user by their Clerk ID.
 * Called from `getMe` to return local DB user data.
 */
export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
      isEmailVerified: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// ─── Helpers ────────────────────────────

function formatUser(user: any): UserResponse {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
  };
}
