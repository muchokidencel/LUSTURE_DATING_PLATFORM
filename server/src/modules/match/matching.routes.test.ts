import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock db
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn(), findMany: vi.fn() },
      blocks: { findMany: vi.fn().mockResolvedValue([]) },
      likes: { findMany: vi.fn().mockResolvedValue([]) },
      matches: { findMany: vi.fn().mockResolvedValue([]) },
      profiles: { findFirst: vi.fn() },
      userPreferences: { findFirst: vi.fn() },
      subscriptions: { findFirst: vi.fn().mockResolvedValue(null) },
      affiliateEarnings: { findMany: vi.fn().mockResolvedValue([]) },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [{ total: '0' }] }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: { id: 'id', premiumTier: 'premiumTier', ghostMode: 'ghostMode', lastActiveAt: 'lastActiveAt' },
  profiles: { userId: 'userId', gender: 'gender', location: 'location', birthDate: 'birthDate' },
  userPreferences: { userId: 'userId', interestedInGenders: 'interestedInGenders', minAge: 'minAge', maxAge: 'maxAge' },
  likes: { fromUserId: 'fromUserId', toUserId: 'toUserId' },
  matches: { userOneId: 'userOneId', userTwoId: 'userTwoId' },
  blocks: { blockerId: 'blockerId', blockedId: 'blockedId' },
  photos: {},
}));

// Mock authenticate middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  AuthRequest: {},
}));

// Mock syncPremiumStatus
vi.mock('../../middleware/sync-premium.js', () => ({
  syncUserPremiumStatus: vi.fn(),
}));

// Mock utils
vi.mock('../../shared/utils.js', () => ({
  getDistanceKm: vi.fn().mockReturnValue(10),
}));

describe('Matching Routes - Recommendations Engine', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    const matchingRoutes = (await import('./matching.routes.js')).default;
    app.use('/api/matching', matchingRoutes);
  });

  describe('GET /api/matching/recommendations', () => {
    it('should return 403 for free users', async () => {
      const { syncUserPremiumStatus } = await import('../../middleware/sync-premium.js');
      vi.mocked(syncUserPremiumStatus).mockResolvedValue('free');

      const res = await request(app)
        .get('/api/matching/recommendations')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Premium subscription required');
    });

    it('should return scored candidates for premium users', async () => {
      const { syncUserPremiumStatus } = await import('../../middleware/sync-premium.js');
      vi.mocked(syncUserPremiumStatus).mockResolvedValue('basic');

      const { db } = await import('../../db/index.js');

      // Mock user with profile and preferences
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 1,
        premiumTier: 'basic',
        profile: { fullName: 'Test', location: 'Nairobi', birthDate: new Date('1995-01-01'), latitude: null, longitude: null },
        preferences: { interestedInGenders: [], minAge: 18, maxAge: 40, maxDistanceKm: 50 },
      } as any);

      // Mock candidates
      vi.mocked(db.query.users.findMany).mockResolvedValue([
        {
          id: 2,
          premiumTier: 'free',
          ghostMode: false,
          photos: [],
          lastActiveAt: new Date(),
          profile: { fullName: 'Jane', location: 'Nairobi', birthDate: new Date('1998-06-15'), gender: 'female', bio: 'Hello world!', isVerified: true, latitude: null, longitude: null },
          preferences: { intentPreference: null },
        },
      ] as any);

      const res = await request(app)
        .get('/api/matching/recommendations')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].displayName).toBe('Jane');
      expect(typeof res.body.data[0].compatibilityScore).toBe('number');
    });

    it('should return 404 if user not found', async () => {
      const { syncUserPremiumStatus } = await import('../../middleware/sync-premium.js');
      vi.mocked(syncUserPremiumStatus).mockResolvedValue('basic');

      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/matching/recommendations')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle errors gracefully', async () => {
      const { syncUserPremiumStatus } = await import('../../middleware/sync-premium.js');
      vi.mocked(syncUserPremiumStatus).mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/matching/recommendations')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching recommendations');
    });

    it('should filter out candidates by age preference', async () => {
      const { syncUserPremiumStatus } = await import('../../middleware/sync-premium.js');
      vi.mocked(syncUserPremiumStatus).mockResolvedValue('basic');

      const { db } = await import('../../db/index.js');

      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 1,
        premiumTier: 'basic',
        profile: { fullName: 'Test', location: 'Nairobi', latitude: null, longitude: null },
        preferences: { interestedInGenders: [], minAge: 25, maxAge: 30, maxDistanceKm: 50 },
      } as any);

      // One candidate is 22 (too young), one is 27 (in range)
      vi.mocked(db.query.users.findMany).mockResolvedValue([
        {
          id: 3,
          premiumTier: 'free',
          ghostMode: false,
          photos: [],
          lastActiveAt: new Date(),
          profile: { fullName: 'Young User', location: 'Nairobi', birthDate: new Date('2004-01-01'), gender: 'female', bio: '', latitude: null, longitude: null },
          preferences: {},
        },
        {
          id: 4,
          premiumTier: 'free',
          ghostMode: false,
          photos: [],
          lastActiveAt: new Date(),
          profile: { fullName: 'InRange User', location: 'Nairobi', birthDate: new Date('1999-01-01'), gender: 'female', bio: '', latitude: null, longitude: null },
          preferences: {},
        },
      ] as any);

      const res = await request(app)
        .get('/api/matching/recommendations')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      // Only InRange User should pass the age filter
      const names = res.body.data.map((d: any) => d.displayName);
      expect(names).toContain('InRange User');
      expect(names).not.toContain('Young User');
    });
  });
});
