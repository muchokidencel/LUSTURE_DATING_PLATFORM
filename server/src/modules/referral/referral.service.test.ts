import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMaturedEarnings } from './referral.service';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
  db: {
    query: {
      affiliateEarnings: { findMany: vi.fn() },
    },
    transaction: vi.fn().mockImplementation(async (cb) => {
      const tx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      };
      return await cb(tx);
    }),
  },
}));

describe('referral.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processMaturedEarnings', () => {
    it('should do nothing if no matured earnings', async () => {
      vi.mocked(db.query.affiliateEarnings.findMany).mockResolvedValue([]);
      await processMaturedEarnings();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it('should process matured earnings', async () => {
      const matured = [
        { id: 1, amount: 50, userId: 1, referralId: 1, status: 'pending', availableAt: new Date() }
      ];
      vi.mocked(db.query.affiliateEarnings.findMany).mockResolvedValue(matured as any);
      
      await processMaturedEarnings();
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
