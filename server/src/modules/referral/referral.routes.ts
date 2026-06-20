import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, referrals, affiliateEarnings, withdrawals, referralCodes } from '../../db/schema.js';
import { eq, sql, and, desc, or, inArray } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

import { getRelativeTime } from '../../shared/utils.js';

const router = Router();

/**
 * GET /api/referrals/stats
 * Header card data: total referrals, conversions, earnings.
 */
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // 1. Referral Stats
    const referralStats = await db.select({
      totalReferrals: sql<number>`count(*)::int`,
      conversions: sql<number>`count(*) filter (where status in ('converted', 'paid'))::int`,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

    // 2. Earning Stats
    const earningStats = await db.select({
      totalEarnings: sql<number>`coalesce(sum(amount) filter (where status in ('available', 'withdrawn')), 0)::int`,
      pendingEarnings: sql<number>`coalesce(sum(amount) filter (where status = 'pending'), 0)::int`,
      availableEarnings: sql<number>`coalesce(sum(amount) filter (where status = 'available'), 0)::int`,
      withdrawnEarnings: sql<number>`coalesce(sum(amount) filter (where status = 'withdrawn'), 0)::int`,
    })
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.userId, userId));

    const ref = referralStats[0] || { totalReferrals: 0, conversions: 0 };
    const earn = earningStats[0] || { totalEarnings: 0, pendingEarnings: 0, availableEarnings: 0, withdrawnEarnings: 0 };

    // 3. Compatible History for legacy UI (prevents crash)
    const historyData = await db.query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
      limit: 10,
      orderBy: [desc(referrals.referredAt)]
    });
    
    const formattedHistory = historyData.map(h => ({
      id: h.id,
      name: 'Anonymous',
      date: h.referredAt,
      status: h.status === 'pending' ? 'Pending' : 'Converted',
      earnings: h.status === 'pending' ? 0 : 50
    }));

    const conversionRate = ref.totalReferrals > 0 
      ? Math.round((ref.conversions / ref.totalReferrals) * 100) 
      : 0;

    res.json({
      status: 'success',
      data: {
        totalReferrals: Number(ref.totalReferrals),
        conversions: Number(ref.conversions),
        conversionRate: `${conversionRate}%`,
        totalEarnings: Number(earn.totalEarnings),
        pendingEarnings: Number(earn.pendingEarnings),
        availableEarnings: Number(earn.availableEarnings),
        withdrawnEarnings: Number(earn.withdrawnEarnings),
        history: formattedHistory
      }
    });
  } catch (error) {
    console.error('Referral Stats Error:', error);
    res.status(500).json({ message: 'Error fetching referral stats' });
  }
});

/**
 * GET /api/referrals/link
 * Returns the user's unique referral link.
 */
router.get('/link', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const codeRecord = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, userId),
    });

    const code = codeRecord?.code || 'ERROR';
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    res.json({
      status: 'success',
      data: {
        code,
        url: `${baseUrl}/register?ref=${code}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching referral link' });
  }
});

/**
 * GET /api/referrals/activity
 * Recent activity feed (last 10 events).
 */
router.get('/activity', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // We combine events from referrals, earnings, and withdrawals
    const signupEvents = await db.query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
      limit: 10,
      orderBy: [desc(referrals.referredAt)]
    });

    const earningEvents = await db.query.affiliateEarnings.findMany({
      where: eq(affiliateEarnings.userId, userId),
      limit: 10,
      orderBy: [desc(affiliateEarnings.createdAt)]
    });

    const withdrawalEvents = await db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, userId),
      limit: 10,
      orderBy: [desc(withdrawals.requestedAt)]
    });

    // Map and flatten
    const allEvents = [
      ...signupEvents.map(e => ({
        type: 'SIGNUP',
        text: 'Someone signed up using your link',
        timestamp: e.referredAt,
        status: 'pending'
      })),
      ...earningEvents.map(e => ({
        type: e.status === 'pending' ? 'CONVERTED' : 'EARNINGS_AVAILABLE',
        text: e.status === 'pending' 
          ? `Your referral converted to Premium! KES ${e.amount} pending` 
          : `KES ${e.amount} is now available for withdrawal`,
        timestamp: e.status === 'pending' ? e.createdAt : e.availableAt,
        amount: e.amount,
        status: e.status
      })),
      ...withdrawalEvents.map(e => ({
        type: 'WITHDRAWN',
        text: e.withdrawalStatus === 'completed'
          ? `KES ${e.amount} withdrawn successfully`
          : e.withdrawalStatus === 'rejected'
          ? `Withdrawal of KES ${e.amount} was rejected`
          : `KES ${e.amount} withdrawal requested`,
        timestamp: e.processedAt || e.requestedAt,
        amount: e.amount,
        status: e.withdrawalStatus
      }))
    ];

    // Sort by timestamp and take top 10
    const sortedEvents = allEvents
      .filter(e => e.timestamp)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 10);

    res.json({
      status: 'success',
      data: sortedEvents.map(e => ({
        ...e,
        timeAgo: getRelativeTime(e.timestamp!)
      }))
    });
  } catch (error) {
    console.error('Activity Feed Error:', error);
    res.status(500).json({ message: 'Error fetching activity feed' });
  }
});

/**
 * GET /api/referrals/earnings
 * Detailed breakdown of available vs pending earnings.
 */
router.get('/earnings', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const pendingStats = await db.select({
      amount: sql<number>`coalesce(sum(amount), 0)::int`,
    })
    .from(affiliateEarnings)
    .where(and(eq(affiliateEarnings.userId, userId), eq(affiliateEarnings.status, 'pending')));

    res.json({
      status: 'success',
      data: {
        available: user?.totalEarnings || 0,
        pending: pendingStats[0]?.amount || 0,
        threshold: 500,
        canWithdraw: (user?.totalEarnings || 0) >= 500
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching earnings' });
  }
});

/**
 * POST /api/referrals/withdraw
 * Triggers a withdrawal request for all available earnings.
 */
router.post('/withdraw', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    let insufficientBalance = false;
    await db.transaction(async (tx) => {
      // 1. Get user's available balance
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || (user.totalEarnings || 0) < 500) {
        insufficientBalance = true;
        return;
      }

      const amountToWithdraw = user.totalEarnings!;

      // 2. Create withdrawal record
      await tx.insert(withdrawals).values({
        userId,
        amount: amountToWithdraw,
        withdrawalStatus: 'requested',
        provider: 'MPESA', // Default for now
        requestedAt: new Date(),
      });

      // 3. Mark all 'available' earnings as 'withdrawn'
      await tx.update(affiliateEarnings)
        .set({ status: 'withdrawn' })
        .where(and(
          eq(affiliateEarnings.userId, userId),
          eq(affiliateEarnings.status, 'available')
        ));

      // 4. Reset user's totalEarnings balance
      await tx.update(users)
        .set({ totalEarnings: 0 })
        .where(eq(users.id, userId));
      
      // Trigger notification: "Your withdrawal of KES X is being processed"
    });

    if (insufficientBalance) {
      return res.status(400).json({ message: 'Minimum KES 500 required for withdrawal' });
    }

    res.json({ status: 'success', message: 'Withdrawal requested successfully' });
  } catch (error) {
    console.error('Withdrawal Error:', error);
    res.status(500).json({ message: 'Error processing withdrawal' });
  }
});

/**
 * ADMIN: GET /api/admin/withdrawals
 * List all pending withdrawal requests.
 */
router.get('/admin/withdrawals', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  try {
    const pendingWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.withdrawalStatus, 'requested'),
      orderBy: [desc(withdrawals.requestedAt)],
      with: {
        // userId: true // Drizzle relational query would need this set up
      }
    });
    res.json({ status: 'success', data: pendingWithdrawals });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching withdrawals' });
  }
});

/**
 * ADMIN: PUT /api/admin/withdrawals/:id
 * Approve or Reject a withdrawal.
 */
router.put('/admin/withdrawals/:id', authenticate, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  
  const { id } = req.params;
  const { status, reference } = req.body; // 'completed' or 'rejected'

  try {
    const withdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, parseInt(id as string)),
    });

    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    await db.transaction(async (tx) => {
      if (status === 'completed') {
        await tx.update(withdrawals)
          .set({ 
            withdrawalStatus: 'completed', 
            processedAt: new Date(), 
            paymentReference: reference 
          })
          .where(eq(withdrawals.id, withdrawal.id));
        // Notification: "Your withdrawal of KES X has been processed"
      } else if (status === 'rejected') {
        // Reverse logic: Return funds to available balance
        await tx.update(withdrawals)
          .set({ withdrawalStatus: 'rejected', processedAt: new Date() })
          .where(eq(withdrawals.id, withdrawal.id));

        await tx.update(users)
          .set({ totalEarnings: sql`${users.totalEarnings} + ${withdrawal.amount}` })
          .where(eq(users.id, withdrawal.userId));

        // Mark associated earnings back to 'available' is tricky without tracking which ones
        // For simplicity, we just rely on the totalEarnings balance restoration
        // or we could find earnings linked to this period. 
        // Given we reset totalEarnings to 0 on withdraw, restoring the sum is correct.
      }
    });

    res.json({ status: 'success', message: `Withdrawal ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating withdrawal' });
  }
});

export default router;
