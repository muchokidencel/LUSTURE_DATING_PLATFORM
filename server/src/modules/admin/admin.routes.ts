import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, affiliateEarnings } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { jsonToCsv } from '../../shared/csv.utils.js';

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

/**
 * GET /api/admin/export/users
 * Export all users as a CSV file. Admin-only.
 */
router.get('/export/users', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user!.id;
  console.log(`[ADMIN:EXPORT:USERS] Requested by adminId: ${adminId}`);

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        premiumTier: users.premiumTier,
        role: users.role,
        createdAt: users.createdAt,
        fullName: profiles.fullName,
        gender: profiles.gender,
        city: profiles.location,
        age: profiles.age,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .orderBy(users.createdAt);

    const flatData = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName ?? '',
      gender: u.gender ?? '',
      city: u.city ?? '',
      age: u.age ?? '',
      premiumTier: u.premiumTier ?? 'free',
      role: u.role ?? 'user',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
    }));

    const csv = jsonToCsv(flatData as Record<string, unknown>[]);
    console.log(`[ADMIN:EXPORT:USERS] Exporting ${flatData.length} users`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    return res.send(csv);
  } catch (error) {
    console.error(`[ADMIN:EXPORT:USERS:ERROR]`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/export/commissions
 * Export pending affiliate commission breakdown as a CSV file. Admin-only.
 */
router.get('/export/commissions', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const adminId = req.user!.id;
  console.log(`[ADMIN:EXPORT:COMMISSIONS] Requested by adminId: ${adminId}`);

  try {
    const rows = await db
      .select({
        earningId: affiliateEarnings.id,
        userId: affiliateEarnings.userId,
        email: users.email,
        displayName: profiles.fullName,
        amount: affiliateEarnings.amount,
        currency: affiliateEarnings.currency,
        status: affiliateEarnings.status,
        createdAt: affiliateEarnings.createdAt,
      })
      .from(affiliateEarnings)
      .innerJoin(users, eq(users.id, affiliateEarnings.userId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .orderBy(affiliateEarnings.createdAt);

    const flatData = rows.map((r) => ({
      earningId: r.earningId,
      userId: r.userId,
      email: r.email,
      displayName: r.displayName ?? 'Anonymous',
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
    }));

    const csv = jsonToCsv(flatData as Record<string, unknown>[]);
    console.log(`[ADMIN:EXPORT:COMMISSIONS] Exporting ${flatData.length} commission records`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="commissions_export.csv"');
    return res.send(csv);
  } catch (error) {
    console.error(`[ADMIN:EXPORT:COMMISSIONS:ERROR]`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
