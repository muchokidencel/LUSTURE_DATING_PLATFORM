import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock db
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      likes: {
        findMany: vi.fn(),
      },
    },
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: { id: 'id' },
  profiles: { userId: 'userId' },
  likes: { toUserId: 'toUserId', fromUserId: 'fromUserId' },
}));

// Mock authenticate middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  AuthRequest: {},
}));

describe('Likes Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    const likesRoutes = (await import('./likes.routes.js')).default;
    app.use('/api/likes', likesRoutes);
  });

  describe('GET /api/likes/received', () => {
    it('should return received likes for authenticated user', async () => {
      const { db } = await import('../../db/index.js');

      vi.mocked(db.query.likes.findMany).mockResolvedValue([
        {
          id: 1,
          fromUserId: 5,
          toUserId: 1,
          type: 'standard',
          createdAt: new Date(),
          fromUser: {
            id: 5,
            photos: [],
            premiumTier: 'free',
            profile: {
              fullName: 'Jane Liker',
              birthDate: new Date('1998-01-01'),
              gender: 'female',
              location: 'Nairobi',
              isVerified: true,
            },
          },
        },
      ] as any);

      const res = await request(app)
        .get('/api/likes/received')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].displayName).toBe('Jane Liker');
      expect(res.body.data[0].city).toBe('Nairobi');
      expect(res.body.data[0].isVerified).toBe(true);
    });

    it('should return empty array when no likes received', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.likes.findMany).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/likes/received')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual([]);
    });

    it('should handle null profile gracefully', async () => {
      const { db } = await import('../../db/index.js');

      vi.mocked(db.query.likes.findMany).mockResolvedValue([
        {
          id: 2,
          fromUserId: 6,
          toUserId: 1,
          fromUser: {
            id: 6,
            photos: null,
            premiumTier: 'free',
            profile: null,
          },
        },
      ] as any);

      const res = await request(app)
        .get('/api/likes/received')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.data[0].displayName).toBe('Anonymous');
      expect(res.body.data[0].city).toBe('Unknown');
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.likes.findMany).mockRejectedValue(new Error('DB Error'));

      const res = await request(app)
        .get('/api/likes/received')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching received likes');
    });
  });
});
