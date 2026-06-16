import { db } from '../db/index.js';
import { users, subscriptions } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Ensures a user's premiumTier is in sync with their active subscriptions.
 * If an active sub is found but tier is 'free', it updates to 'basic'.
 * If no active sub is found but tier is NOT 'free', it updates to 'free'.
 */
export const syncUserPremiumStatus = async (userId: number) => {
  try {
    const now = new Date();
    const activeSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.endDate, now)
      ),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.endDate)]
    });

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return null;

    if (activeSub) {
      if (user.premiumTier === 'free') {
        console.log(`[AUTH:SYNC] User ${userId} has active sub but was 'free'. Syncing to 'basic'.`);
        await db.update(users)
          .set({ premiumTier: 'basic' })
          .where(eq(users.id, userId));
        return 'basic';
      }
      return user.premiumTier;
    } else {
      if (user.premiumTier !== 'free' && user.role !== 'admin') {
        console.log(`[AUTH:SYNC] User ${userId} has no active sub but was '${user.premiumTier}'. Syncing to 'free'.`);
        await db.update(users)
          .set({ premiumTier: 'free' })
          .where(eq(users.id, userId));
        return 'free';
      }
      return user.premiumTier;
    }
  } catch (error) {
    console.error(`[AUTH:SYNC] Error syncing for User ${userId}:`, error);
    return null;
  }
};
