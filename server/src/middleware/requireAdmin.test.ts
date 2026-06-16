import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from './requireAdmin';
import { db } from '../db/index';

vi.mock('../db/index', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
  },
}));

describe('requireAdmin Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { user: { id: 1 } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 401 if no user in request', async () => {
    delete req.user;
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ role: 'user' } as any);
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next if user is admin', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ role: 'admin' } as any);
    await requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
