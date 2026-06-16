import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from './profile.routes';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      profiles: {
        findFirst: vi.fn(),
      },
      userPreferences: {
        findFirst: vi.fn(),
      },
      photos: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
}));

vi.mock('../../middleware/validate', () => ({
  validate: () => (req: any, res: any, next: any) => {
    next();
  },
}));

vi.mock('../../middleware/sync-premium', () => ({
  syncUserPremiumStatus: vi.fn().mockResolvedValue('free'),
}));

describe('Profile Routes', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('GET /me should retrieve own profile details', async () => {
    const mockUser = { id: 1, email: 'test@example.com', photos: [] };
    const mockProfile = { userId: 1, fullName: 'Test User', location: 'Nairobi', latitude: 1.2, longitude: 36.8 };
    const mockPrefs = { userId: 1, interestedInGenders: ['female'] };

    vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);
    vi.mocked(db.query.profiles.findFirst).mockResolvedValue(mockProfile as any);
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue(mockPrefs as any);

    req = {
      method: 'GET',
      url: '/me',
      user: { id: 1 },
    };

    const route = router.stack.find((s) => s.route?.path === '/me' && s.route?.methods?.get);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: expect.objectContaining({
        fullName: 'Test User',
        whatsapp: '',
        instagram: '',
        premiumTier: 'free',
      }),
    });
  });

  it('PUT / should update profile with manual city input and null latitude/longitude', async () => {
    const mockUser = { id: 1, email: 'test@example.com', profile: { fullName: 'Test User', location: 'Mombasa', latitude: null, longitude: null } };
    vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

    req = {
      method: 'PUT',
      url: '/',
      user: { id: 1 },
      body: {
        displayName: 'Test User',
        city: 'Mombasa',
        latitude: null,
        longitude: null,
      },
    };

    const route = router.stack.find((s) => s.route?.path === '/' && s.route?.methods?.put);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(db.insert).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockUser,
    });
  });
});
