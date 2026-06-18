import { vi } from 'vitest';

process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

// Global mock for DB
vi.mock('../db/index.js', () => ({
  db: {
    query: {
      users: { 
        findFirst: vi.fn().mockResolvedValue({ id: 1, email: 'test@test.com', premiumTier: 'free' }), 
        findMany: vi.fn().mockResolvedValue([]) 
      },
      profiles: { 
        findFirst: vi.fn().mockResolvedValue({ userId: 1, fullName: 'Test User' }) 
      },
      blocks: { findMany: vi.fn().mockResolvedValue([]) },
      userPreferences: { 
        findFirst: vi.fn().mockResolvedValue({ userId: 1, interestedInGenders: [], maxDistanceKm: 50 }) 
      },
      subscriptions: { findFirst: vi.fn().mockResolvedValue(null) },
      affiliateEarnings: { findMany: vi.fn().mockResolvedValue([]) },
      photos: { findMany: vi.fn().mockResolvedValue([]) },
      referralCodes: { findFirst: vi.fn().mockResolvedValue(null) },
      referrals: { findFirst: vi.fn().mockResolvedValue(null) },
      emailVerificationCodes: { findFirst: vi.fn().mockResolvedValue(null) },
      notifications: { findMany: vi.fn().mockResolvedValue([]) },
      passes: { findMany: vi.fn().mockResolvedValue([]) },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [{ total: '0' }] }),
    transaction: vi.fn().mockImplementation(async (cb) => {
      const tx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
      };
      return await cb(tx);
    }),
  },
}));

// Global mock for JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn().mockReturnValue({ id: 1, email: 'test@test.com', role: 'user' }),
    sign: vi.fn().mockReturnValue('mock_token'),
  },
}));

// Global mock for bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

// Global mock for cloudinary
vi.mock('../config/cloudinary.js', () => ({
  default: {
    config: vi.fn().mockReturnValue({ cloud_name: 'test' }),
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: 'http://test.com/photo.jpg', public_id: '123' }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

// Global mock for axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));
