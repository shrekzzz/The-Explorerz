import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import prisma from '../config/database.js';
import type { Express } from 'express';

describe('RBAC (Role-Based Access Control)', () => {
  let app: Express;
  let userToken: string;
  let staffToken: string;
  let adminToken: string;
  let testPackageId: string;

  beforeAll(async () => {
    app = createApp();

    // Create test users with different roles
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `user-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Regular',
        lastName: 'User',
      });
    userToken = userRes.body.data.accessToken;

    // Create staff user (need to update role in DB)
    const staffRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `staff-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Staff',
        lastName: 'User',
      });
    await prisma.user.update({
      where: { email: staffRes.body.data.user.email },
      data: { role: 'STAFF' },
    });
    // Login again to get token with updated role
    const staffLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: staffRes.body.data.user.email,
        password: 'Test123!@#',
      });
    staffToken = staffLoginRes.body.data.accessToken;

    // Create admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Admin',
        lastName: 'User',
      });
    await prisma.user.update({
      where: { email: adminRes.body.data.user.email },
      data: { role: 'ADMIN' },
    });
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminRes.body.data.user.email,
        password: 'Test123!@#',
      });
    adminToken = adminLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: Date.now().toString().slice(0, 10),
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('Package Management', () => {
    describe('POST /api/packages (Create)', () => {
      it('should allow STAFF to create packages', async () => {
        const res = await request(app)
          .post('/api/packages')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            title: 'Test Package',
            subtitle: 'Test Description',
            category: 'PILGRIMAGE',
            duration: '5 Days',
            price: 15000,
            locations: ['Kedarnath'],
            highlights: ['Temple Visit'],
            bestTime: 'May-October',
            difficulty: 'MODERATE',
            included: ['Accommodation', 'Meals'],
            status: 'AVAILABLE',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        testPackageId = res.body.data.id;
      });

      it('should allow ADMIN to create packages', async () => {
        const res = await request(app)
          .post('/api/packages')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Admin Test Package',
            subtitle: 'Test Description',
            category: 'TREK',
            duration: '3 Days',
            price: 10000,
            locations: ['Manali'],
            highlights: ['Trekking'],
            bestTime: 'June-September',
            difficulty: 'DIFFICULT',
            included: ['Guide', 'Equipment'],
            status: 'AVAILABLE',
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('should deny USER from creating packages', async () => {
        const res = await request(app)
          .post('/api/packages')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Unauthorized Package',
            subtitle: 'Test',
            category: 'PILGRIMAGE',
            duration: '5 Days',
            price: 15000,
            locations: ['Test'],
            highlights: ['Test'],
            bestTime: 'Test',
            included: ['Test'],
            status: 'AVAILABLE',
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/packages/:id (Update)', () => {
      it('should allow STAFF to update packages', async () => {
        const res = await request(app)
          .put(`/api/packages/${testPackageId}`)
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            title: 'Updated Package',
            price: 16000,
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should deny USER from updating packages', async () => {
        const res = await request(app)
          .put(`/api/packages/${testPackageId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Unauthorized Update',
          });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('DELETE /api/packages/:id', () => {
      it('should deny STAFF from deleting packages', async () => {
        const res = await request(app)
          .delete(`/api/packages/${testPackageId}`)
          .set('Authorization', `Bearer ${staffToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('should allow ADMIN to delete packages', async () => {
        const res = await request(app)
          .delete(`/api/packages/${testPackageId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should deny USER from deleting packages', async () => {
        const res = await request(app)
          .delete(`/api/packages/${testPackageId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/dashboard', () => {
      it('should allow ADMIN to access dashboard', async () => {
        const res = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalUsers');
        expect(res.body.data).toHaveProperty('totalPackages');
      });

      it('should deny USER from accessing dashboard', async () => {
        const res = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });

      it('should deny STAFF from accessing dashboard', async () => {
        const res = await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${staffToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/admin/users', () => {
      it('should allow ADMIN to list users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should deny USER from listing users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/admin/audit-logs', () => {
      it('should allow ADMIN to view audit logs', async () => {
        const res = await request(app)
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should deny USER from viewing audit logs', async () => {
        const res = await request(app)
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Booking Management', () => {
    describe('GET /api/bookings', () => {
      it('should allow USER to view own bookings', async () => {
        const res = await request(app)
          .get('/api/bookings')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should allow ADMIN to view all bookings', async () => {
        const res = await request(app)
          .get('/api/bookings')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('Public Endpoints (No Auth Required)', () => {
    it('should allow anyone to view packages', async () => {
      const res = await request(app).get('/api/packages');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow anyone to view package details', async () => {
      // Create a package first
      const createRes = await request(app)
        .post('/api/packages')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          title: 'Public Test Package',
          subtitle: 'Test',
          category: 'PILGRIMAGE',
          duration: '5 Days',
          price: 15000,
          locations: ['Test'],
          highlights: ['Test'],
          bestTime: 'Test',
          included: ['Test'],
          status: 'AVAILABLE',
        });

      const packageId = createRes.body.data.id;

      const res = await request(app).get(`/api/packages/${packageId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
