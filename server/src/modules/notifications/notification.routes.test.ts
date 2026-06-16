import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from './notification.routes';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
  db: {
    query: {
      notifications: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  },
}));

describe('Notifications Routes', () => {
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

  it('GET / should retrieve recent notifications', async () => {
    const mockNotifications = [
      { id: 1, userId: 1, type: 'like', content: 'Someone liked you', isRead: false },
    ];
    vi.mocked(db.query.notifications.findMany).mockResolvedValue(mockNotifications as any);

    req = {
      method: 'GET',
      url: '/',
      user: { id: 1 },
    };

    // Find the handler for GET /
    const route = router.stack.find((s) => s.route?.path === '/' && s.route?.methods?.get);
    expect(route).toBeDefined();

    // The stack has: authenticate, handler
    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(db.query.notifications.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: mockNotifications,
    });
  });

  it('PUT /read-all should mark all user notifications as read', async () => {
    req = {
      method: 'PUT',
      url: '/read-all',
      user: { id: 1 },
    };

    const route = router.stack.find((s) => s.route?.path === '/read-all' && s.route?.methods?.put);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(db.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ status: 'success' });
  });

  it('PUT /:id/read should mark a specific notification as read', async () => {
    req = {
      method: 'PUT',
      url: '/123/read',
      params: { id: '123' },
      user: { id: 1 },
    };

    const route = router.stack.find((s) => s.route?.path === '/:id/read' && s.route?.methods?.put);
    expect(route).toBeDefined();

    const handler = route.route.stack[route.route.stack.length - 1].handle;
    await handler(req, res);

    expect(db.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ status: 'success' });
  });
});
