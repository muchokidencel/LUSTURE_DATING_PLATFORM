import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock transaction object
const mockTx = {
  query: {
    subscriptions: {
      findFirst: vi.fn(),
    },
    referrals: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockImplementation(() => Promise.resolve()),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(() => Promise.resolve()),
};

// Mock database
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      payments: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockImplementation(() => Promise.resolve()),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => Promise.resolve()),
    transaction: vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    }),
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: { id: 'id', premiumTier: 'premiumTier', totalEarnings: 'totalEarnings' },
  payments: { id: 'id', userId: 'userId', amount: 'amount', provider: 'provider', status: 'status', providerRef: 'providerRef' },
  subscriptions: { id: 'id', userId: 'userId', endDate: 'endDate', status: 'status' },
  affiliateEarnings: { id: 'id', userId: 'userId', amount: 'amount', referralId: 'referralId', status: 'status', availableAt: 'availableAt', createdAt: 'createdAt' },
  referrals: { id: 'id', referrerId: 'referrerId', referredId: 'referredId', status: 'status', convertedAt: 'convertedAt', coolingEndsAt: 'coolingEndsAt', paidAt: 'paidAt' },
}));

// Mock authenticate middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
}));

describe('Payments Routes - Paystack module', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_paystackkey';

    app = express();
    app.use(express.json());

    const paymentRoutes = (await import('./payment.routes.js')).default;
    app.use('/api/payments', paymentRoutes);
  });

  describe('POST /pay/paystack/initialize', () => {
    it('should initialize a payment successfully', async () => {
      const mockPaystackResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/mock-url',
            reference: 'PAY-TEST-100',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValueOnce(mockPaystackResponse);

      const { db } = await import('../../db/index.js');
      const insertMock = vi.mocked(db.insert);

      const res = await request(app)
        .post('/api/payments/pay/paystack/initialize')
        .send({ amount: 500, email: 'test@example.com', callbackUrl: 'http://localhost:5173/premium' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reference).toBe('PAY-TEST-100');
      expect(res.body.data.authorization_url).toBe('https://checkout.paystack.com/mock-url');
      expect(insertMock).toHaveBeenCalled();
    });

    it('should handle payment initialization errors', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Paystack connection timed out'));

      const res = await request(app)
        .post('/api/payments/pay/paystack/initialize')
        .send({ amount: 500, email: 'test@example.com' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error initializing Paystack payment');
    });
  });

  describe('GET /pay/paystack/verify/:reference', () => {
    it('should verify payment successfully, create sub, promotion and referral credit', async () => {
      const mockVerifyResponse = {
        data: {
          data: {
            status: 'success',
            gateway_response: 'Successful',
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockVerifyResponse);

      const { db } = await import('../../db/index.js');
      
      // Mock payment record found
      const mockPayment = {
        id: 10,
        userId: 1,
        amount: 500,
        provider: 'paystack',
        status: 'pending',
        providerRef: 'PAY-TEST-100',
      };
      vi.mocked(db.query.payments.findFirst).mockResolvedValueOnce(mockPayment as any);

      // Mock subscription search: none active
      vi.mocked(mockTx.query.subscriptions.findFirst).mockResolvedValueOnce(undefined);

      // Mock referral search: found pending referral
      const mockReferral = {
        id: 5,
        referrerId: 2,
        referredId: 1,
        status: 'pending',
      };
      vi.mocked(mockTx.query.referrals.findFirst).mockResolvedValueOnce(mockReferral as any);

      const res = await request(app)
        .get('/api/payments/pay/paystack/verify/PAY-TEST-100');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Payment verified and subscription activated');

      // Verify db updates occurred
      expect(db.update).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('should handle not found payment records during verification', async () => {
      const mockVerifyResponse = {
        data: {
          data: {
            status: 'success',
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce(mockVerifyResponse);

      const { db } = await import('../../db/index.js');
      vi.mocked(db.query.payments.findFirst).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .get('/api/payments/pay/paystack/verify/PAY-TEST-100');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Payment record not found');
    });
  });
});
