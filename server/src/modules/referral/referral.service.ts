import cron from 'node-cron';
import { db } from '../../db/index.js';
import { affiliateEarnings, referrals, users } from '../../db/schema.js';
import { eq, and, lte, sql } from 'drizzle-orm';

/**
 * Initializes the referral cron jobs.
 */
export const initReferralCron = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Referral Cooling Period Job...');
    await processMaturedEarnings();
  });
  
  // Also run on startup to handle any that matured while server was down
  processMaturedEarnings().catch(err => console.error('Startup Referral Job Error:', err));
};

/**
 * Finds earnings that have passed their cooling period and promotes them to 'available'.
 */
export const processMaturedEarnings = async () => {
  try {
    const now = new Date();

    // 1. Find matured earnings (status = 'pending' and availableAt <= now)
    const maturedEarnings = await db.query.affiliateEarnings.findMany({
      where: and(
        eq(affiliateEarnings.status, 'pending'),
        lte(affiliateEarnings.availableAt, now)
      )
    });

    if (maturedEarnings.length === 0) {
      console.log('No matured earnings to process.');
      return;
    }

    for (const earning of maturedEarnings) {
      await db.transaction(async (tx) => {
        // 2. Update earning status to 'available'
        await tx.update(affiliateEarnings)
          .set({ status: 'available' })
          .where(eq(affiliateEarnings.id, earning.id));

        // 3. Update referral status to 'paid'
        await tx.update(referrals)
          .set({ status: 'paid', paidAt: now })
          .where(eq(referrals.id, earning.referralId));

        // 4. Increment referrer's total_earnings balance
        await tx.update(users)
          .set({ 
            totalEarnings: sql`${users.totalEarnings} + ${earning.amount}` 
          })
          .where(eq(users.id, earning.userId));
        
        // Trigger notification: "KES 50 is now available for withdrawal"
        // This would call a notification service in a full implementation
      });
    }
    
    console.log(`Processed ${maturedEarnings.length} matured earnings.`);
  } catch (error) {
    console.error('Error in Referral Cooling Job:', error);
  }
};
