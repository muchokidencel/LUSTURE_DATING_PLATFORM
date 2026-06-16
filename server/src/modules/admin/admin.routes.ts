import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, affiliateEarnings } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user!.id;
  console.log(`[ADMIN:STATS:REQUEST] adminUserId: ${adminId}`);
  
  try {
    const [userStats, commissionStats, affiliateBreakdown] = await Promise.all([
      // User stats
      db.select({
        premium_count: sql<number>`COUNT(*) FILTER (WHERE premium_tier != 'free')`,
        free_count: sql<number>`COUNT(*) FILTER (WHERE premium_tier = 'free' OR premium_tier IS NULL)`,
        total_users: sql<number>`COUNT(*)`
      }).from(users),

      // Commission stats
      db.select({
        pending_commission_count: sql<number>`COUNT(*)`,
        total_pending_amount: sql<number>`SUM(amount)`,
        currency: sql<string>`currency`
      }).from(affiliateEarnings)
        .where(eq(affiliateEarnings.status, 'pending'))
        .groupBy(sql`currency`),

      // Per-affiliate breakdown
      db.select({
        displayName: profiles.fullName,
        email: users.email,
        pendingCount: sql<number>`COUNT(${affiliateEarnings.id})`,
        totalOwed: sql<number>`SUM(${affiliateEarnings.amount})`,
        currency: affiliateEarnings.currency
      }).from(affiliateEarnings)
        .innerJoin(users, eq(users.id, affiliateEarnings.userId))
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(eq(affiliateEarnings.status, 'pending'))
        .groupBy(users.id, users.email, profiles.fullName, affiliateEarnings.currency)
        .orderBy(sql`SUM(${affiliateEarnings.amount}) DESC`)
    ]);

    const uStats = userStats[0];
    const total = Number(uStats.total_users);
    const premium = Number(uStats.premium_count);
    const free = Number(uStats.free_count);
    const premiumPercentage = total > 0 ? Math.round((premium / total) * 100) : 0;

    const cStats = commissionStats[0] || { pending_commission_count: 0, total_pending_amount: 0, currency: 'KES' };

    const result = {
      users: {
        total,
        premium,
        free,
        premiumPercentage
      },
      commissions: {
        totalPendingAmount: Number(cStats.total_pending_amount),
        totalPendingCount: Number(cStats.pending_commission_count),
        currency: cStats.currency || 'KES',
        byAffiliate: affiliateBreakdown.map(a => ({
          displayName: a.displayName || 'Anonymous',
          email: a.email,
          pendingCount: Number(a.pendingCount),
          totalOwed: Number(a.totalOwed)
        }))
      }
    };

    console.log(`[ADMIN:STATS:RESULT] Users: ${total}, Premium: ${premium}, Pending Amount: ${result.commissions.totalPendingAmount}`);
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error(`[ADMIN:STATS:ERROR]`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user!.id;
  console.log(`[ADMIN:READ] Fetching all users. Requested by Admin: ${adminId}`);
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        profile: true,
      }
    });
    console.log(`[ADMIN:READ] SUCCESS. Returned ${allUsers.length} users.`);
    res.json({ status: 'success', data: allUsers });
  } catch (error) {
    console.error(`[ADMIN:READ] Error fetching users:`, error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

export default router;
