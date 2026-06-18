import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendNotification, triggerReEngagement } from './notification.service';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      notificationPreferences: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    execute: vi.fn().mockReturnThis(),
  },
}));

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send in-app notification if enabled', async () => {
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({ pushEnabled: true, inAppEnabled: true } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ premiumTier: 'basic' } as any);
      
      await sendNotification(1, 'match', 'Test content');
      expect(db.insert).toHaveBeenCalled();
    });

    it('should not send in-app if disabled', async () => {
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({ pushEnabled: true, inAppEnabled: false } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ premiumTier: 'basic' } as any);
      
      await sendNotification(1, 'match', 'Test content');
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should send in-app notification instantly for standard like even if recipient is free tier', async () => {
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({ pushEnabled: true, inAppEnabled: true } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ premiumTier: 'free' } as any);
      
      await sendNotification(1, 'like', 'Someone liked your profile!');
      expect(db.insert).toHaveBeenCalled();
    });

    it('should batch notifications for free users on low-priority events', async () => {
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({ pushEnabled: true, inAppEnabled: true } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ premiumTier: 'free' } as any);
      
      // 're_engagement' is not in the instant list (match, super_like, like)
      await sendNotification(1, 're_engagement' as any, 'Batch this');
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(db.query.notificationPreferences.findFirst).mockRejectedValue(new Error('DB Error'));
      
      await sendNotification(1, 'match', 'Test content');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('triggerReEngagement', () => {
    it('should send notifications to inactive users with pending likes', async () => {
      const mockInactiveUsers = {
        rows: [
          { id: 1, email: 'user1@example.com' },
          { id: 2, email: 'user2@example.com' }
        ]
      };
      vi.mocked(db.execute).mockResolvedValue(mockInactiveUsers as any);
      
      // Mock sendNotification dependencies within triggerReEngagement
      vi.mocked(db.query.notificationPreferences.findFirst).mockResolvedValue({ pushEnabled: true, inAppEnabled: true } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ premiumTier: 'premium' } as any);

      await triggerReEngagement();
      
      expect(db.execute).toHaveBeenCalled();
      // Should call insert for each user because we mocked them as premium
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });
});
