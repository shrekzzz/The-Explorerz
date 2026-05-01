import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import prisma from '../config/database.js';
import type { Express } from 'express';

describe('Authentication Flow', () => {
  let app: Express;
  let testEmail: string;
  let accessToken: string;
  let refreshCookie: string;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    // Generate unique email for each test
    testEmail = `test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe('USER');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      // Save for next tests
      accessToken = res.body.data.accessToken;
      refreshCookie = res.headers['set-cookie'][0];
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Test123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshCookie = res.headers['set-cookie'][0];
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Register and login
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
      accessToken = res.body.data.accessToken;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Register and login
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
      accessToken = res.body.data.accessToken;
      refreshCookie = res.headers['set-cookie'][0];
    });

    it('should refresh token with valid refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(accessToken); // New token
      expect(res.headers['set-cookie']).toBeDefined(); // New refresh cookie
    });

    it('should reject refresh without cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Register and login
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
      accessToken = res.body.data.accessToken;
      refreshCookie = res.headers['set-cookie'][0];
    });

    it('should logout and invalidate session', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Try to refresh with old cookie (should fail)
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    beforeEach(async () => {
      // Register and login
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
      accessToken = res.body.data.accessToken;
    });

    it('should logout from all devices', async () => {
      // Login from "another device"
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Test123!@#',
        });
      const refreshCookie2 = res2.headers['set-cookie'][0];

      // Logout from all devices
      const logoutRes = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(200);

      // Both sessions should be invalid
      const refresh1 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);
      const refresh2 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie2);

      expect(refresh1.status).toBe(401);
      expect(refresh2.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const attempts = [];

      // Make 6 rapid login attempts (limit is 5 per 15 min)
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrong',
            })
        );
      }

      const results = await Promise.all(attempts);
      const rateLimited = results.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
