import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendNotification } from './notification.service';
import { db } from '../../db/index';

vi.mock('../../db/index', () => ({
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
  });
});
