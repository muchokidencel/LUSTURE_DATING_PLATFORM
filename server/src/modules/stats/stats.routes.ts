import { Router } from 'express';
import { db } from '../../db/index.js';
import { likes, matches, profileViews, subscriptions } from '../../db/schema.js';
import { eq, or, and, sql } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { syncUserPremiumStatus } from '../../middleware/sync-premium.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const likesCount = await db.select({ count: sql`count(*)` })
      .from(likes)
      .where(eq(likes.toUserId, userId));

    const matchesCount = await db.select({ count: sql`count(*)` })
      .from(matches)
      .where(or(eq(matches.userOneId, userId), eq(matches.userTwoId, userId)));

    const viewsCount = await db.select({ count: sql`count(*)` })
      .from(profileViews)
      .where(eq(profileViews.profileId, userId));

    res.json({
      status: 'success',
      data: {
        likes: Number(likesCount[0].count),
        matches: Number(matchesCount[0].count),
        views: Number(viewsCount[0].count)
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/subscription', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // Sync status
    await syncUserPremiumStatus(userId);

    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.endDate)]
    });

    res.json({
      status: 'success',
      data: subscription || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription status' });
  }
});

export default router;
