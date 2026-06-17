import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from './discovery.routes';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
  db: {
    query: {
      blocks: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      profiles: {
        findFirst: vi.fn(),
      },
      userPreferences: {
        findFirst: vi.fn(),
      },
      users: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    execute: vi.fn().mockResolvedValue({
      rows: [{ total: '0' }],
    }),
  },
}));

vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
}));

let mockSyncUserPremiumStatus = vi.fn().mockResolvedValue('free');
vi.mock('../../middleware/sync-premium', () => ({
  syncUserPremiumStatus: (userId: number) => mockSyncUserPremiumStatus(userId),
}));

describe('Discovery Routes', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('GET /users should allow free users and return a success status', async () => {
    mockSyncUserPremiumStatus.mockResolvedValue('free');

    const mockProfile = { userId: 1, fullName: 'Test User', location: 'Nairobi', latitude: 1.2, longitude: 36.8 };
    const mockPrefs = { userId: 1, maxDistanceKm: 50 };
    const mockUsersList = [
      {
        id: 2,
        email: 'other@example.com',
        ghostMode: false,
        lastActiveAt: new Date(),
        premiumTier: 'free',
        profile: {
          fullName: 'Other User',
          location: 'Nairobi',
          latitude: 1.2,
          longitude: 36.8,
        },
      },
    ];

    vi.mocked(db.query.profiles.findFirst).mockResolvedValue(mockProfile as any);
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue(mockPrefs as any);
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsersList as any);
    vi.mocked(db.execute).mockResolvedValue({
      rows: [{ total: '1' }],
    } as any);

    req = {
      method: 'GET',
      url: '/users',
      user: { id: 1 },
      query: {},
    };

    const route = router.stack.find((s) => s.route?.path === '/users' && s.route?.methods?.get);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.any(Array),
      pagination: expect.any(Object),
    });
  });

  it('GET /users should allow premium users and return successful status', async () => {
    mockSyncUserPremiumStatus.mockResolvedValue('gold');

    const mockProfile = { userId: 1, fullName: 'Test User', location: 'Nairobi', latitude: 1.2, longitude: 36.8 };
    const mockPrefs = { userId: 1, maxDistanceKm: 50 };
    const mockUsersList = [
      {
        id: 3,
        email: 'premium-other@example.com',
        ghostMode: false,
        lastActiveAt: new Date(),
        premiumTier: 'gold',
        profile: {
          fullName: 'Premium Other',
          location: 'Nairobi',
          latitude: 1.2,
          longitude: 36.8,
        },
      },
    ];

    vi.mocked(db.query.profiles.findFirst).mockResolvedValue(mockProfile as any);
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue(mockPrefs as any);
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsersList as any);
    vi.mocked(db.execute).mockResolvedValue({
      rows: [{ total: '1' }],
    } as any);

    req = {
      method: 'GET',
      url: '/users',
      user: { id: 1 },
      query: {},
    };

    const route = router.stack.find((s) => s.route?.path === '/users' && s.route?.methods?.get);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.any(Array),
      pagination: expect.any(Object),
    });
  });
});
