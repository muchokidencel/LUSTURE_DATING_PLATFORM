import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ──────────────────────────────────────────────────────────────────────────────
// Mock DB and auth middleware so we can test the route in isolation
// ──────────────────────────────────────────────────────────────────────────────

const mockUsersRows = [
  {
    id: 1,
    email: 'alice@example.com',
    premiumTier: 'gold',
    role: 'user',
    createdAt: new Date('2025-01-01').toISOString(),
    fullName: 'Alice Wanjiru',
    gender: 'Female',
    city: 'Nairobi',
    age: 28,
  },
  {
    id: 2,
    email: 'bob@example.com',
    premiumTier: 'free',
    role: 'user',
    createdAt: new Date('2025-02-01').toISOString(),
    fullName: 'Bob Omondi',
    gender: 'Male',
    city: 'Mombasa',
    age: 32,
  },
];

const mockCommissionRows = [
  {
    earningId: 10,
    userId: 3,
    email: 'referrer@example.com',
    displayName: 'Carol Njeri',
    amount: '500',
    currency: 'KES',
    status: 'pending',
    createdAt: new Date('2025-03-01').toISOString(),
  },
];

// Mock the db module
vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  },
}));

// Mock schema
vi.mock('../../db/schema.js', () => ({
  users: {},
  profiles: {},
  affiliateEarnings: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  sql: vi.fn(),
}));

// Mock auth and requireAdmin middleware to inject a fake admin user
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 99, role: 'admin' };
    next();
  },
}));

vi.mock('../../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

describe('Admin Export Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { db } = await import('../../db/index.js');
    // Chain: db.select().from().leftJoin().orderBy() -> resolves
    const selectMock = db.select as unknown as ReturnType<typeof vi.fn>;
    selectMock.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockUsersRows),
        }),
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockCommissionRows),
          }),
        }),
      }),
    }));

    app = express();
    app.use(express.json());

    // Dynamically import the router after mocking
    const adminRoutes = (await import('./admin.routes.js')).default;
    app.use('/api/admin', adminRoutes);
  });

  // ── /export/users ──────────────────────────────────────────────────────────

  it('GET /api/admin/export/users returns 200 with text/csv content type', async () => {
    const res = await request(app).get('/api/admin/export/users');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('GET /api/admin/export/users sets Content-Disposition header for download', async () => {
    const res = await request(app).get('/api/admin/export/users');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('users_export.csv');
  });

  it('GET /api/admin/export/users body contains CSV header row', async () => {
    const res = await request(app).get('/api/admin/export/users');
    const lines = (res.text as string).split('\n');
    expect(lines[0]).toContain('id');
    expect(lines[0]).toContain('email');
    expect(lines[0]).toContain('premiumTier');
  });

  it('GET /api/admin/export/users body contains user data rows', async () => {
    const res = await request(app).get('/api/admin/export/users');
    expect(res.text).toContain('alice@example.com');
    expect(res.text).toContain('bob@example.com');
  });

  // ── /export/commissions ────────────────────────────────────────────────────

  it('GET /api/admin/export/commissions returns 200 with text/csv content type', async () => {
    const res = await request(app).get('/api/admin/export/commissions');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('GET /api/admin/export/commissions sets Content-Disposition header for download', async () => {
    const res = await request(app).get('/api/admin/export/commissions');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('commissions_export.csv');
  });

  it('GET /api/admin/export/commissions body contains commission header fields', async () => {
    const res = await request(app).get('/api/admin/export/commissions');
    const lines = (res.text as string).split('\n');
    expect(lines[0]).toContain('earningId');
    expect(lines[0]).toContain('email');
    expect(lines[0]).toContain('amount');
    expect(lines[0]).toContain('currency');
    expect(lines[0]).toContain('status');
  });

  it('GET /api/admin/export/commissions body contains commission data', async () => {
    const res = await request(app).get('/api/admin/export/commissions');
    expect(res.text).toContain('referrer@example.com');
    expect(res.text).toContain('500');
    expect(res.text).toContain('KES');
  });
});
