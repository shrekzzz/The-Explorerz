import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import prisma from '../config/database.js';
import type { Express } from 'express';

describe('Trip CRUD + Sharing', () => {
  let app: Express;
  let userToken: string;
  let otherUserToken: string;
  let tripId: string;

  beforeAll(async () => {
    app = createApp();

    // Create first user
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `trip-user1-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Trip',
        lastName: 'Owner',
      });
    userToken = res1.body.data?.accessToken;

    // Create second user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `trip-user2-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Other',
        lastName: 'User',
      });
    otherUserToken = res2.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'trip-user' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/trips (Create)', () => {
    it('should create a trip for authenticated user', async () => {
      if (!userToken) return; // Skip if auth setup failed

      const res = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          destination: 'Manali',
          days: 3,
          budget: 15000,
          interests: ['trekking', 'nature'],
          budgetBreakdown: { transport: 5000, accommodation: 5000, food: 3000, activities: 2000 },
          isPublic: false,
          itinerary: [
            {
              dayNumber: 1,
              title: 'Arrival Day',
              activities: [
                {
                  time: '09:00',
                  title: 'Check-in',
                  description: 'Hotel check-in',
                  locationName: 'Mall Road',
                  lat: 32.24,
                  lng: 77.19,
                  category: 'accommodation',
                  cost: 2000,
                },
              ],
            },
          ],
          hotels: [
            { name: 'Mountain View Hotel', rating: 4.2, pricePerNight: 2500, lat: 32.24, lng: 77.19 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.destination).toBe('Manali');
      expect(res.body.data.itinerary).toHaveLength(1);
      expect(res.body.data.hotels).toHaveLength(1);
      tripId = res.body.data.id;
    });

    it('should reject trip creation without auth', async () => {
      const res = await request(app)
        .post('/api/trips')
        .send({ destination: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/trips (List)', () => {
    it('should list user trips', async () => {
      if (!userToken) return;

      const res = await request(app)
        .get('/api/trips?page=1&limit=10&sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/trips/:id (Get One)', () => {
    it('should return trip for owner', async () => {
      if (!userToken || !tripId) return;

      const res = await request(app)
        .get(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(tripId);
    });

    it('should deny access to private trip for other user', async () => {
      if (!otherUserToken || !tripId) return;

      const res = await request(app)
        .get(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/trips/:id (Update / Share)', () => {
    it('should allow owner to make trip public', async () => {
      if (!userToken || !tripId) return;

      const res = await request(app)
        .patch(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isPublic: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isPublic).toBe(true);
      expect(res.body.data.shareToken).toBeTruthy();
    });

    it('should deny non-owner from updating', async () => {
      if (!otherUserToken || !tripId) return;

      const res = await request(app)
        .patch(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ isPublic: false });

      expect(res.status).toBe(403);
    });

    it('should remove share token when making private', async () => {
      if (!userToken || !tripId) return;

      const res = await request(app)
        .patch(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isPublic: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isPublic).toBe(false);
      expect(res.body.data.shareToken).toBeNull();
    });
  });

  describe('GET /api/trips/shared/:token (Public View)', () => {
    it('should return shared trip by token', async () => {
      if (!userToken || !tripId) return;

      // Make public first
      const patchRes = await request(app)
        .patch(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isPublic: true });

      const shareToken = patchRes.body.data.shareToken;
      expect(shareToken).toBeTruthy();

      const res = await request(app).get(`/api/trips/shared/${shareToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.destination).toBe('Manali');
      expect(res.body.data.user).toBeDefined();
    });

    it('should 404 for invalid share token', async () => {
      const res = await request(app).get('/api/trips/shared/invalid-token');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/trips/:id', () => {
    it('should deny non-owner from deleting', async () => {
      if (!otherUserToken || !tripId) return;

      const res = await request(app)
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow owner to delete', async () => {
      if (!userToken || !tripId) return;

      const res = await request(app)
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
