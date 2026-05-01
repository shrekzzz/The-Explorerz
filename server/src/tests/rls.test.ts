/**
 * ════════════════════════════════════════════════════════════════════════════
 * ROW-LEVEL SECURITY (RLS) TESTS
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * These tests verify that RLS policies are correctly enforcing access control
 * at the database level.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, Role } from '@prisma/client';
import {
  withUserContext,
  withSystemContext,
  setUserContext,
  clearUserContext,
  isRLSContextSet,
  getRLSContext
} from '../utils/rls';

const prisma = new PrismaClient();

// Test users
let regularUser: any;
let otherUser: any;
let adminUser: any;
let staffUser: any;

// Test data
let userTrip: any;
let otherUserTrip: any;
let publicTrip: any;

beforeAll(async () => {
  // Create test users using system context (bypasses RLS)
  await withSystemContext(prisma, async (tx) => {
    regularUser = await tx.user.create({
      data: {
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        role: Role.USER
      }
    });

    otherUser = await tx.user.create({
      data: {
        email: 'other@test.com',
        firstName: 'Other',
        lastName: 'User',
        role: Role.USER
      }
    });

    adminUser = await tx.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN
      }
    });

    staffUser = await tx.user.create({
      data: {
        email: 'staff@test.com',
        firstName: 'Staff',
        lastName: 'User',
        role: Role.STAFF
      }
    });
  });

  // Create test trips
  await withUserContext(prisma, regularUser.id, regularUser.role, async (tx) => {
    userTrip = await tx.trip.create({
      data: {
        userId: regularUser.id,
        destination: 'Kedarnath',
        days: 5,
        budget: 50000,
        interests: ['TEMPLES', 'NATURE'],
        isPublic: false
      }
    });
  });

  await withUserContext(prisma, otherUser.id, otherUser.role, async (tx) => {
    otherUserTrip = await tx.trip.create({
      data: {
        userId: otherUser.id,
        destination: 'Badrinath',
        days: 4,
        budget: 40000,
        interests: ['TEMPLES'],
        isPublic: false
      }
    });

    publicTrip = await tx.trip.create({
      data: {
        userId: otherUser.id,
        destination: 'Char Dham',
        days: 10,
        budget: 100000,
        interests: ['TEMPLES', 'NATURE'],
        isPublic: true
      }
    });
  });
});

afterAll(async () => {
  // Clean up test data using system context
  await withSystemContext(prisma, async (tx) => {
    await tx.trip.deleteMany({
      where: {
        userId: { in: [regularUser.id, otherUser.id] }
      }
    });

    await tx.user.deleteMany({
      where: {
        email: { in: ['user@test.com', 'other@test.com', 'admin@test.com', 'staff@test.com'] }
      }
    });
  });

  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear RLS context before each test
  await clearUserContext(prisma);
});

describe('RLS Context Management', () => {
  it('should set and retrieve RLS context', async () => {
    await setUserContext(prisma, regularUser.id, regularUser.role);
    
    const context = await getRLSContext(prisma);
    expect(context).not.toBeNull();
    expect(context?.userId).toBe(regularUser.id);
    expect(context?.userRole).toBe(regularUser.role);
  });

  it('should detect when RLS context is set', async () => {
    let isSet = await isRLSContextSet(prisma);
    expect(isSet).toBe(false);

    await setUserContext(prisma, regularUser.id, regularUser.role);
    
    isSet = await isRLSContextSet(prisma);
    expect(isSet).toBe(true);
  });

  it('should clear RLS context', async () => {
    await setUserContext(prisma, regularUser.id, regularUser.role);
    await clearUserContext(prisma);
    
    const context = await getRLSContext(prisma);
    expect(context).toBeNull();
  });
});

describe('Trip RLS Policies', () => {
  it('should only return user own trips', async () => {
    const trips = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => tx.trip.findMany()
    );

    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe(userTrip.id);
    expect(trips[0].userId).toBe(regularUser.id);
  });

  it('should not return other users trips', async () => {
    const trips = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => tx.trip.findMany()
    );

    const otherUserTripIds = trips.map(t => t.id);
    expect(otherUserTripIds).not.toContain(otherUserTrip.id);
  });

  it('should return public trips to all users', async () => {
    const trips = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => tx.trip.findMany()
    );

    const publicTripIds = trips.map(t => t.id);
    expect(publicTripIds).toContain(publicTrip.id);
  });

  it('should allow admin to see all trips', async () => {
    const trips = await withUserContext(
      prisma,
      adminUser.id,
      adminUser.role,
      async (tx) => tx.trip.findMany()
    );

    expect(trips.length).toBeGreaterThanOrEqual(3);
    const tripIds = trips.map(t => t.id);
    expect(tripIds).toContain(userTrip.id);
    expect(tripIds).toContain(otherUserTrip.id);
    expect(tripIds).toContain(publicTrip.id);
  });

  it('should prevent user from updating other users trips', async () => {
    await expect(
      withUserContext(
        prisma,
        regularUser.id,
        regularUser.role,
        async (tx) => {
          return tx.trip.update({
            where: { id: otherUserTrip.id },
            data: { destination: 'Hacked!' }
          });
        }
      )
    ).rejects.toThrow();
  });

  it('should allow user to update their own trips', async () => {
    const updated = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.trip.update({
          where: { id: userTrip.id },
          data: { destination: 'Kedarnath Updated' }
        });
      }
    );

    expect(updated.destination).toBe('Kedarnath Updated');
  });

  it('should prevent user from deleting other users trips', async () => {
    await expect(
      withUserContext(
        prisma,
        regularUser.id,
        regularUser.role,
        async (tx) => {
          return tx.trip.delete({
            where: { id: otherUserTrip.id }
          });
        }
      )
    ).rejects.toThrow();
  });

  it('should allow user to delete their own trips', async () => {
    // Create a trip to delete
    const tripToDelete = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.trip.create({
          data: {
            userId: regularUser.id,
            destination: 'To Delete',
            days: 1,
            budget: 1000,
            interests: ['TEMPLES']
          }
        });
      }
    );

    // Delete it
    await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.trip.delete({
          where: { id: tripToDelete.id }
        });
      }
    );

    // Verify it's deleted
    const trips = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => tx.trip.findMany()
    );

    expect(trips.find(t => t.id === tripToDelete.id)).toBeUndefined();
  });
});

describe('User RLS Policies', () => {
  it('should allow user to view their own profile', async () => {
    const user = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.user.findUnique({
          where: { id: regularUser.id }
        });
      }
    );

    expect(user).not.toBeNull();
    expect(user?.id).toBe(regularUser.id);
  });

  it('should prevent user from viewing other users profiles', async () => {
    const user = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.user.findUnique({
          where: { id: otherUser.id }
        });
      }
    );

    expect(user).toBeNull();
  });

  it('should allow admin to view all users', async () => {
    const users = await withUserContext(
      prisma,
      adminUser.id,
      adminUser.role,
      async (tx) => tx.user.findMany()
    );

    expect(users.length).toBeGreaterThanOrEqual(4);
    const userIds = users.map(u => u.id);
    expect(userIds).toContain(regularUser.id);
    expect(userIds).toContain(otherUser.id);
  });

  it('should prevent user from changing their role', async () => {
    await expect(
      withUserContext(
        prisma,
        regularUser.id,
        regularUser.role,
        async (tx) => {
          return tx.user.update({
            where: { id: regularUser.id },
            data: { role: Role.ADMIN }
          });
        }
      )
    ).rejects.toThrow();
  });

  it('should allow user to update their own profile (non-sensitive fields)', async () => {
    const updated = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => {
        return tx.user.update({
          where: { id: regularUser.id },
          data: { firstName: 'Updated' }
        });
      }
    );

    expect(updated.firstName).toBe('Updated');
  });
});

describe('System Context', () => {
  it('should allow system operations without user context', async () => {
    const user = await withSystemContext(prisma, async (tx) => {
      return tx.user.create({
        data: {
          email: 'system@test.com',
          firstName: 'System',
          lastName: 'User',
          role: Role.USER
        }
      });
    });

    expect(user).not.toBeNull();
    expect(user.email).toBe('system@test.com');

    // Clean up
    await withSystemContext(prisma, async (tx) => {
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('should only return public trips without user context', async () => {
    const trips = await withSystemContext(prisma, async (tx) => {
      return tx.trip.findMany();
    });

    // Should only return public trips
    expect(trips.every(t => t.isPublic)).toBe(true);
  });
});

describe('Package RLS Policies', () => {
  let testPackage: any;

  beforeAll(async () => {
    // Create a test package as staff
    testPackage = await withUserContext(
      prisma,
      staffUser.id,
      staffUser.role,
      async (tx) => {
        return tx.package.create({
          data: {
            title: 'Test Package',
            subtitle: 'Test Description',
            category: 'PILGRIMAGE',
            duration: '5 days',
            price: 50000,
            locations: ['Kedarnath'],
            highlights: ['Temple Visit'],
            bestTime: 'May-October',
            status: 'AVAILABLE',
            included: ['Transport', 'Accommodation'],
            createdBy: staffUser.id
          }
        });
      }
    );
  });

  afterAll(async () => {
    // Clean up
    await withSystemContext(prisma, async (tx) => {
      await tx.package.delete({ where: { id: testPackage.id } });
    });
  });

  it('should allow everyone to view available packages', async () => {
    const packages = await withUserContext(
      prisma,
      regularUser.id,
      regularUser.role,
      async (tx) => tx.package.findMany()
    );

    expect(packages.length).toBeGreaterThan(0);
  });

  it('should prevent regular user from creating packages', async () => {
    await expect(
      withUserContext(
        prisma,
        regularUser.id,
        regularUser.role,
        async (tx) => {
          return tx.package.create({
            data: {
              title: 'Unauthorized Package',
              subtitle: 'Should Fail',
              category: 'PILGRIMAGE',
              duration: '5 days',
              price: 50000,
              locations: ['Test'],
              highlights: ['Test'],
              bestTime: 'Test',
              status: 'AVAILABLE',
              included: ['Test']
            }
          });
        }
      )
    ).rejects.toThrow();
  });

  it('should allow staff to create packages', async () => {
    const pkg = await withUserContext(
      prisma,
      staffUser.id,
      staffUser.role,
      async (tx) => {
        return tx.package.create({
          data: {
            title: 'Staff Package',
            subtitle: 'Created by Staff',
            category: 'PILGRIMAGE',
            duration: '5 days',
            price: 50000,
            locations: ['Test'],
            highlights: ['Test'],
            bestTime: 'Test',
            status: 'AVAILABLE',
            included: ['Test'],
            createdBy: staffUser.id
          }
        });
      }
    );

    expect(pkg).not.toBeNull();

    // Clean up
    await withSystemContext(prisma, async (tx) => {
      await tx.package.delete({ where: { id: pkg.id } });
    });
  });
});
