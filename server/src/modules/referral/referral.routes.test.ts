import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockTx = {
  query: {
    users: { findFirst: vi.fn() },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

// Mock db
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      referrals: { findFirst: vi.fn(), findMany: vi.fn() },
      referralCodes: { findFirst: vi.fn() },
      affiliateEarnings: { findMany: vi.fn() },
      withdrawals: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ totalReferrals: 5, conversions: 3 }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation(async (cb) => await cb(mockTx)),
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: { id: 'id', referralCode: 'referralCode', totalEarnings: 'totalEarnings' },
  referrals: { id: 'id', referrerId: 'referrerId', referredId: 'referredId', referredAt: 'referredAt', status: 'status' },
  referralCodes: { userId: 'userId', code: 'code' },
  affiliateEarnings: { id: 'id', userId: 'userId', amount: 'amount', status: 'status' },
  withdrawals: { id: 'id', userId: 'userId', amount: 'amount', withdrawalStatus: 'withdrawalStatus', requestedAt: 'requestedAt' },
}));

// Mock authenticate middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
  AuthRequest: {},
}));

// Mock utils
vi.mock('../../shared/utils.js', () => ({
  getRelativeTime: vi.fn().mockReturnValue('2 hours ago'),
}));

describe('Referral Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    const referralRoutes = (await import('./referral.routes.js')).default;
    app.use('/api/referrals', referralRoutes);
  });

  describe('GET /api/referrals/stats', () => {
    it('should return aggregated referral stats', async () => {
      const { db } = await import('../../db/index.js');

      // Mock select chain for referral stats
      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ totalReferrals: 10, conversions: 4 }]),
        }),
      };
      vi.mocked(db.select).mockReturnValue(mockSelectChain as any);

      // Mock referral history
      vi.mocked(db.query.referrals.findMany).mockResolvedValue([
        { id: 1, referredAt: new Date(), status: 'converted' },
      ] as any);

      const res = await request(app)
        .get('/api/referrals/stats')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('totalReferrals');
      expect(res.body.data).toHaveProperty('totalEarnings');
    });

    it('should handle errors gracefully', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.select).mockImplementation(() => { throw new Error('DB Error'); });

      const res = await request(app)
        .get('/api/referrals/stats')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error fetching referral stats');
    });
  });

  describe('GET /api/referrals/link', () => {
    it('should return referral URL with user code', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.referralCodes.findFirst).mockResolvedValue({
        userId: 1,
        code: 'TEST1234',
      } as any);

      const res = await request(app)
        .get('/api/referrals/link')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.code).toBe('TEST1234');
      expect(res.body.data.url).toContain('ref=TEST1234');
    });

    it('should return ERROR code when no referral code found', async () => {
      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.referralCodes.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/referrals/link')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe('ERROR');
    });
  });

  describe('GET /api/referrals/activity', () => {
    it('should return sorted activity feed', async () => {
      const { db } = await import('../../db/index.js');

      vi.mocked(db.query.referrals.findMany).mockResolvedValue([
        { id: 1, referredAt: new Date(), referrerId: 1 },
      ] as any);
      vi.mocked(db.query.affiliateEarnings.findMany).mockResolvedValue([
        { id: 1, status: 'pending', amount: 50, createdAt: new Date(), availableAt: null },
      ] as any);
      vi.mocked(db.query.withdrawals.findMany).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/referrals/activity')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/referrals/earnings', () => {
    it('should return available vs pending breakdown', async () => {
      const { db } = await import('../../db/index.js');

      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 1,
        totalEarnings: 600,
      } as any);

      const mockSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ amount: 100 }]),
        }),
      };
      vi.mocked(db.select).mockReturnValue(mockSelectChain as any);

      const res = await request(app)
        .get('/api/referrals/earnings')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(600);
      expect(res.body.data.pending).toBe(100);
      expect(res.body.data.canWithdraw).toBe(true);
      expect(res.body.data.threshold).toBe(500);
    });
  });

  describe('POST /api/referrals/withdraw', () => {
    it('should process withdrawal with sufficient balance (>= KES 500)', async () => {
      mockTx.query.users.findFirst.mockResolvedValue({
        id: 1,
        totalEarnings: 600,
      } as any);

      const res = await request(app)
        .post('/api/referrals/withdraw')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Withdrawal requested successfully');
    });

    it('should reject withdrawal with insufficient balance (< KES 500)', async () => {
      mockTx.query.users.findFirst.mockResolvedValue({
        id: 1,
        totalEarnings: 200,
      } as any);

      const res = await request(app)
        .post('/api/referrals/withdraw')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Minimum KES 500 required for withdrawal');
    });
  });

  describe('Admin Withdrawal Management', () => {
    it('should reject non-admin users from listing withdrawals', async () => {
      const res = await request(app)
        .get('/api/referrals/admin/withdrawals')
        .set('Authorization', 'Bearer mock_token');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });
  });
});
