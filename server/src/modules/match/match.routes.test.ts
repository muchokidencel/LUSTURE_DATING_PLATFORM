import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock db
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      matches: { findFirst: vi.fn(), findMany: vi.fn() },
      profiles: { findFirst: vi.fn() },
      subscriptions: { findFirst: vi.fn().mockResolvedValue(null) },
      affiliateEarnings: { findMany: vi.fn().mockResolvedValue([]) },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: { id: 'id', premiumTier: 'premiumTier' },
  matches: { id: 'id', userOneId: 'userOneId', userTwoId: 'userTwoId', userOneRevealConsent: 'userOneRevealConsent', userTwoRevealConsent: 'userTwoRevealConsent' },
  profiles: { userId: 'userId' },
}));

// Mock authenticate middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  AuthRequest: {},
}));

describe('Match Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    const matchRoutes = (await import('./match.routes.js')).default;
    app.use('/api/matches', matchRoutes);
  });

  describe('GET /api/matches', () => {
    it('should return formatted match list with contact details', async () => {
      const { db } = await import('../../db/index.js');

      // Mock current user
      vi.mocked(db.query.users.findFirst)
        .mockResolvedValueOnce({ id: 1, premiumTier: 'basic' } as any) // Current user
        .mockResolvedValueOnce({ id: 2, whatsapp: '+254700111222', instagram: '@jane', photos: [], premiumTier: 'basic' } as any); // Other user

      // Mock matches
      vi.mocked(db.query.matches.findMany).mockResolvedValue([
        { id: 100, userOneId: 1, userTwoId: 2, createdAt: new Date() },
      ] as any);

      // Mock other user's profile
      vi.mocked(db.query.profiles.findFirst).mockResolvedValue({
        userId: 2,
        fullName: 'Jane Doe',
        gender: 'female',
        bio: 'Hello',
        location: 'Nairobi',
        birthDate: new Date('1998-01-01'),
        isVerified: true,
      } as any);

      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].otherUser.displayName).toBe('Jane Doe');
      expect(res.body.data[0].otherUser.whatsapp).toBe('+254700111222');
    });

    it('should return empty array when no matches exist', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 1, premiumTier: 'basic' } as any);
      vi.mocked(db.query.matches.findMany).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.users.findFirst).mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching matches');
    });
  });

  describe('POST /api/matches/:id/reveal', () => {
    it('should record consent for match reveal', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.matches.findFirst).mockResolvedValue({
        id: 100,
        userOneId: 1,
        userTwoId: 2,
      } as any);

      const res = await request(app)
        .post('/api/matches/100/reveal')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Consent recorded');
      expect(db.update).toHaveBeenCalled();
    });

    it('should return 404 for invalid match ID', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.matches.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/matches/999/reveal')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Match not found');
    });

    it('should return 404 if user is not part of the match', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.matches.findFirst).mockResolvedValue({
        id: 100,
        userOneId: 5,
        userTwoId: 6, // Neither is userId 1
      } as any);

      const res = await request(app)
        .post('/api/matches/100/reveal')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Match not found');
    });
  });
});
