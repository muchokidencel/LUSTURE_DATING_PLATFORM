
import { db } from '../src/db/index.js';
import { users, affiliateEarnings, profiles } from '../src/db/schema.js';
import { sql, eq, and } from 'drizzle-orm';

async function runQueries() {
  console.log('--- User Stats ---');
  const userStats = await db.select({
    premium_count: sql`COUNT(*) FILTER (WHERE premium_tier != 'free')`,
    free_count: sql`COUNT(*) FILTER (WHERE premium_tier = 'free' OR premium_tier IS NULL)`,
    total_users: sql`COUNT(*)`
  }).from(users);
  console.log(userStats[0]);

  console.log('\n--- Pending Commissions ---');
  const pendingCommissions = await db.select({
    pending_commission_count: sql`COUNT(*)`,
    total_pending_amount: sql`SUM(amount)`,
    currency: sql`currency`
  }).from(affiliateEarnings)
    .where(eq(affiliateEarnings.status, 'pending'))
    .groupBy(sql`currency`);
  console.log(pendingCommissions);

  console.log('\n--- Per-Affiliate Breakdown ---');
  const affiliateBreakdown = await db.select({
    id: users.id,
    email: users.email,
    fullName: profiles.fullName,
    pending_count: sql<number>`COUNT(${affiliateEarnings.id})`,
    total_owed: sql<number>`SUM(${affiliateEarnings.amount})`,
    currency: affiliateEarnings.currency
  }).from(affiliateEarnings)
    .innerJoin(users, eq(users.id, affiliateEarnings.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(affiliateEarnings.status, 'pending'))
    .groupBy(users.id, users.email, profiles.fullName, affiliateEarnings.currency)
    .orderBy(sql`SUM(${affiliateEarnings.amount}) DESC`);
  console.log(affiliateBreakdown);
}

runQueries().catch(console.error);
