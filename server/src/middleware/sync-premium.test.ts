import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncUserPremiumStatus } from './sync-premium';
import { db } from '../db/index';

vi.mock('../db/index', () => ({
  db: {
    query: {
      subscriptions: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  },
}));

describe('syncUserPremiumStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if user not found', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(null);
    const result = await syncUserPremiumStatus(1);
    expect(result).toBeNull();
  });

  it('should sync to basic if active sub found but tier is free', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 1, premiumTier: 'free', role: 'user' } as any);
    vi.mocked(db.query.subscriptions.findFirst).mockResolvedValue({ id: 1, status: 'active', endDate: new Date(Date.now() + 10000) } as any);
    
    const result = await syncUserPremiumStatus(1);
    expect(result).toBe('basic');
    expect(db.update).toHaveBeenCalled();
  });

  it('should sync to free if no active sub found but tier was not free', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 1, premiumTier: 'basic', role: 'user' } as any);
    vi.mocked(db.query.subscriptions.findFirst).mockResolvedValue(null);
    
    const result = await syncUserPremiumStatus(1);
    expect(result).toBe('free');
    expect(db.update).toHaveBeenCalled();
  });
});
