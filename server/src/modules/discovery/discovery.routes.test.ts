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
  });
});
