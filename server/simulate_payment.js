import { db } from './src/db/index.js';
import { users, payments, subscriptions, affiliateEarnings, referrals } from './src/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

/**
 * SIMULATE SUCCESSFUL PAYMENT
 * This script manually triggers the 'handleSuccessfulPayment' logic
 * to verify that subscriptions and referral commissions are working.
 */

const simulatePayment = async (userEmail, amount = 500) => {
  console.log(`\n--- Starting Simulation for: ${userEmail} ---`);

  try {
    // 1. Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, userEmail),
    });

    if (!user) {
      console.error('ERROR: User not found!');
      return;
    }

    const uid = Number(user.id);
    console.log(`Found User ID: ${uid}`);

    // 2. Create a dummy payment record
    const providerRef = `SIM-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const [payment] = await db.insert(payments).values({
      userId: uid,
      amount,
      provider: 'simulation',
      status: 'completed',
      providerRef,
    }).returning();

    console.log(`Created Payment Record: ${payment.id} (Ref: ${providerRef})`);

    // 3. Trigger Activation Logic
    await db.transaction(async (tx) => {
      // A. Update/Create Subscription
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const existingSub = await tx.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, uid),
          eq(subscriptions.status, 'active')
        )
      });

      if (existingSub) {
        const newEndDate = new Date(existingSub.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        await tx.update(subscriptions)
          .set({ endDate: newEndDate })
          .where(eq(subscriptions.id, existingSub.id));
        console.log('Updated existing subscription.');
      } else {
        await tx.insert(subscriptions).values({
          userId: uid,
          endDate,
          status: 'active',
        });
        console.log('Created new subscription.');
      }

      // 1.5 Sync User Premium Tier
      await tx.update(users)
        .set({ premiumTier: 'basic' })
        .where(eq(users.id, uid));
      console.log('Synced user premium tier to basic.');

      // B. Referral Commission (Instant Flow)
      if (user.referredBy) {
        const rid = Number(user.referredBy);
        console.log(`User was referred by ID: ${rid}`);
        
        const referralRecord = await tx.query.referrals.findFirst({
          where: and(
            eq(referrals.referrerId, rid),
            eq(referrals.referredId, uid),
            eq(referrals.status, 'pending')
          )
        });

        if (referralRecord) {
          // Update referral status to 'paid'
          await tx.update(referrals)
            .set({
              status: 'paid',
              convertedAt: now,
              coolingEndsAt: now,
              paidAt: now
            })
            .where(eq(referrals.id, referralRecord.id));

          // Create 'available' earnings record
          await tx.insert(affiliateEarnings).values({
            userId: rid,
            amount: 50,
            referralId: referralRecord.id,
            status: 'available',
            availableAt: now,
            createdAt: now,
          });

          // Increment referrer balance
          await tx.update(users)
            .set({ 
              totalEarnings: sql`${users.totalEarnings} + 50` 
            })
            .where(eq(users.id, rid));

          console.log(`SUCCESS: Credited KES 50 to Referrer (ID: ${rid})`);
        } else {
          console.warn('SKIP: No pending referral record found.');
        }
      } else {
        console.log('User was not referred by anyone. No commission needed.');
      }
    });

    console.log('\n--- Simulation Complete ---');
    console.log('Check the Referral Dashboard for the referrer now.');

  } catch (error) {
    console.error('SIMULATION FAILED:', error);
  } finally {
    process.exit();
  }
};

// --- RUN THE SCRIPT ---
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.log('Usage: node simulate_payment.js <user_email>');
  process.exit(1);
}

simulatePayment(targetEmail);
