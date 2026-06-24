import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { getDistanceKm } from '../utils/distance.js';

// Setup authentication flag for test toggling
let isAuthenticated = true;

// Mock database
vi.mock('../db/index.js', () => {
  const chain = {
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue({}),
  };
  return {
    db: {
      insert: vi.fn(() => chain),
    },
  };
});

// Mock schema
vi.mock('../db/schema.js', () => ({
  profiles: {
    userId: 'userId',
    latitude: 'latitude',
    longitude: 'longitude',
    location: 'location',
    locationUpdatedAt: 'location_updated_at',
  },
}));

// Mock authentication middleware
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  AuthRequest: {},
}));

describe('Backend Location Features', () => {
  describe('getDistanceKm (Haversine Utility)', () => {
    it('returns correct km for known coordinates', () => {
      // Nairobi CBD: -1.2833, 36.8167
      // Westlands: -1.2633, 36.8021
      const dist = getDistanceKm(-1.2833, 36.8167, -1.2633, 36.8021);
      expect(dist).toBeGreaterThan(2);
      expect(dist).toBeLessThan(5);
    });

    it('returns Infinity or null when either coordinate is null/undefined', () => {
      expect(getDistanceKm(null as any, 36.8167, -1.2633, 36.8021)).toBe(Infinity);
      expect(getDistanceKm(-1.2833, undefined as any, -1.2633, 36.8021)).toBe(Infinity);
    });
  });

  describe('PATCH /api/profile/location', () => {
    let app: express.Application;

    beforeEach(async () => {
      isAuthenticated = true;
      vi.clearAllMocks();

      app = express();
      app.use(express.json());

      const profileRoutes = (await import('../modules/profile/profile.routes.js')).default;
      app.use('/api/profile', profileRoutes);
    });

    it('updates lat/lon/city and returns 200 with valid payload', async () => {
      const res = await request(app)
        .patch('/api/profile/location')
        .send({ latitude: -1.2921, longitude: 36.8219, city: 'Nairobi' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.location).toEqual({
        latitude: -1.2921,
        longitude: 36.8219,
        city: 'Nairobi',
      });
    });

    it('returns 422 for missing/invalid latitude', async () => {
      const res = await request(app)
        .patch('/api/profile/location')
        .send({ longitude: 36.8219, city: 'Nairobi' }); // missing latitude

      expect(res.status).toBe(422);
    });

    it('returns 401 for unauthenticated request', async () => {
      isAuthenticated = false;

      const res = await request(app)
        .patch('/api/profile/location')
        .send({ latitude: -1.2921, longitude: 36.8219, city: 'Nairobi' });

      expect(res.status).toBe(401);
    });
  });
});
