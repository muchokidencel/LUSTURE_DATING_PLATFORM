import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index.js';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: { findMany: vi.fn(), findFirst: vi.fn() },
      blocks: { findMany: vi.fn().mockResolvedValue([]) },
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

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' }),
    sign: vi.fn().mockReturnValue('mock_token'),
  },
}));

describe('Discovery Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior to prevent 500s from syncPremium
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 1, premiumTier: 'free' } as any);
  });

  describe('GET /api/discovery/users', () => {
    it('should return a list of users for discovery', async () => {
      const mockUsers = [{ id: 2, displayName: 'Jane', profile: { fullName: 'Jane Doe' }, photos: [] }];
      vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);

      const res = await request(app)
        .get('/api/discovery/users')
        .set('Authorization', 'Bearer mock_token');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.query.users.findFirst).mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/discovery/users')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(500);
    });

    it('reports pagination.total/totalPages based on the post-distance-filter set, not the raw query', async () => {
      // 1 user's own coords; profile/preferences findFirst is called for both
      // "my profile" and "my prefs" -- mock by call order (profile, then prefs).
      vi.mocked(db.query.profiles.findFirst).mockResolvedValue({
        userId: 1, latitude: 0, longitude: 0, location: 'Nairobi',
      } as any);
      vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue({
        userId: 1, maxDistanceKm: 100,
      } as any);

      // 3 candidates within range, 2 far outside maxDistanceKm.
      const near = (id: number) => ({
        id, premiumTier: 'free', lastActiveAt: new Date(), photos: [],
        profile: { fullName: `Near ${id}`, latitude: 0.01, longitude: 0.01, location: 'Nairobi' },
      });
      const far = (id: number) => ({
        id, premiumTier: 'free', lastActiveAt: new Date(), photos: [],
        profile: { fullName: `Far ${id}`, latitude: 50, longitude: 50, location: 'Mombasa' },
      });
      vi.mocked(db.query.users.findMany).mockResolvedValue([
        near(2), near(3), far(4), far(5), near(6),
      ] as any);

      const res = await request(app)
        .get('/api/discovery/users')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(1);

      // The DB query itself must not paginate -- filtering happens after fetch.
      const findManyArgs = vi.mocked(db.query.users.findMany).mock.calls[0][0] as any;
      expect(findManyArgs.limit).toBeUndefined();
      expect(findManyArgs.offset).toBeUndefined();
    });
  });
});
