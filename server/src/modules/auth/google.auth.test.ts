import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock db
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      referralCodes: {
        findFirst: vi.fn(),
      },
      referrals: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('../../db/schema.js', () => ({
  users: { email: 'email', password: 'password', isEmailVerified: 'isEmailVerified' },
  profiles: { userId: 'userId', fullName: 'fullName' },
  userPreferences: { userId: 'userId', interestedInGenders: 'interestedInGenders' },
  referralCodes: { userId: 'userId', code: 'code' },
  referrals: { referrerId: 'referrerId', referredId: 'referredId' },
}));

describe('Google Authentication Endpoint', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    app = express();
    app.use(express.json());

    const authRoutes = (await import('./auth.routes.js')).default;
    app.use('/api/auth', authRoutes);
  });

  it('should return 400 if accessToken is missing', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Google access token is required');
  });

  it('should log in existing user successfully', async () => {
    const mockGoogleUser = {
      email: 'existing@example.com',
      name: 'Existing User',
    };

    const mockDbUser = {
      id: 10,
      email: 'existing@example.com',
      referralCode: 'EXISTING10',
      role: 'user',
    };

    // Mock axios response
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockGoogleUser });

    // Mock user search: user exists
    const { db } = await import('../../db/index.js');
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(mockDbUser as any);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ accessToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('existing@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should register and log in new user successfully', async () => {
    const mockGoogleUser = {
      email: 'newuser@example.com',
      name: 'New User',
    };

    const mockDbUser = {
      id: 11,
      email: 'newuser@example.com',
      referralCode: 'NEW11',
      role: 'user',
    };

    // Mock axios response
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockGoogleUser });

    // Mock user search: user does not exist
    const { db } = await import('../../db/index.js');
    vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
    // Mock referral check: no existing legacy/db code
    vi.mocked(db.query.referralCodes.findFirst).mockResolvedValue(undefined);

    // Mock insert returning new user
    const insertMock = db.insert as unknown as ReturnType<typeof vi.fn>;
    insertMock.mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([mockDbUser]),
      })),
    }));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ accessToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('newuser@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });
});
