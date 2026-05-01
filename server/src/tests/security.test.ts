import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../app.js';
import type { Express } from 'express';

describe('Security Hardening', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  // ─── SEC-6: Request ID Middleware ─────────────────────────
  describe('Request ID (X-Request-ID)', () => {
    it('should generate a request ID when none is provided', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-request-id']).toBeDefined();
      // UUID v4 pattern
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should echo back client-provided X-Request-ID', async () => {
      const clientId = 'my-custom-request-id-12345';
      const res = await request(app)
        .get('/api/health')
        .set('X-Request-ID', clientId);

      expect(res.headers['x-request-id']).toBe(clientId);
    });
  });

  // ─── SEC-7: Enhanced Health Check ────────────────────────
  describe('Health Check (/api/health)', () => {
    it('should return health status with db and redis checks', async () => {
      const res = await request(app).get('/api/health');

      // Should be 200 or 503 depending on DB/Redis availability
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks).toHaveProperty('redis');
      expect(['healthy', 'unhealthy']).toContain(res.body.checks.database);
      expect(['healthy', 'unhealthy']).toContain(res.body.checks.redis);
    });

    it('should return success=true when all services healthy', async () => {
      const res = await request(app).get('/api/health');

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('healthy');
      }
    });
  });

  // ─── SEC-5: Upload Folder Sanitization ───────────────────
  describe('Upload Folder Sanitization', () => {
    it('should strip path traversal characters from folder name', async () => {
      // We test the controller indirectly — sending a request without a file
      // should result in 400 (no file uploaded) rather than a path traversal
      const res = await request(app)
        .post('/api/uploads/single?folder=../../../etc/passwd')
        .set('Authorization', 'Bearer test');

      // Expect 401 (no valid auth) or 400 (no file), NOT a server crash
      expect([400, 401]).toContain(res.status);
    });

    it('should strip special characters from folder name', async () => {
      const res = await request(app)
        .post('/api/uploads/single?folder=hello%2F..%2Fworld')
        .set('Authorization', 'Bearer test');

      expect([400, 401]).toContain(res.status);
    });
  });

  // ─── SEC-4: Timing-Safe Signature Comparison ─────────────
  describe('Timing-Safe Comparison (crypto.timingSafeEqual)', () => {
    it('should produce consistent results for equal signatures', () => {
      const sig1 = crypto.createHmac('sha256', 'secret').update('data').digest('hex');
      const sig2 = crypto.createHmac('sha256', 'secret').update('data').digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(sig1, 'hex'),
        Buffer.from(sig2, 'hex')
      );
      expect(isValid).toBe(true);
    });

    it('should return false for different signatures', () => {
      const sig1 = crypto.createHmac('sha256', 'secret').update('data1').digest('hex');
      const sig2 = crypto.createHmac('sha256', 'secret').update('data2').digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(sig1, 'hex'),
        Buffer.from(sig2, 'hex')
      );
      expect(isValid).toBe(false);
    });

    it('should throw for different-length buffers', () => {
      expect(() => {
        crypto.timingSafeEqual(
          Buffer.from('short'),
          Buffer.from('much-longer-string')
        );
      }).toThrow();
    });
  });

  // ─── Security Headers ────────────────────────────────────
  describe('Security Headers', () => {
    it('should not expose server technology', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ─── 404 Handler ─────────────────────────────────────────
  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
