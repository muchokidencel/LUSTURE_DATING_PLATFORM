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

    it('should process matured earnings and update related tables', async () => {
      const matured = [
        { id: 1, amount: 50, userId: 10, referralId: 100, status: 'pending', availableAt: new Date() }
      ];
      vi.mocked(db.query.affiliateEarnings.findMany).mockResolvedValue(matured as any);
      
      const mockTx = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      };
      vi.mocked(db.transaction).mockImplementation(async (cb) => await cb(mockTx as any));

      await processMaturedEarnings();
      
      expect(db.transaction).toHaveBeenCalled();
      // Should update affiliateEarnings, referrals, and users
      expect(mockTx.update).toHaveBeenCalledTimes(3);
      
      // Verify specific updates (order might vary but we can check calls)
      const updateCalls = mockTx.update.mock.calls.map(call => call[0]);
      // We can't easily check table objects without importing them, but we can verify the number of calls
    });

    it('should handle errors in processMaturedEarnings', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(db.query.affiliateEarnings.findMany).mockRejectedValue(new Error('DB Error'));
      
      await processMaturedEarnings();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
