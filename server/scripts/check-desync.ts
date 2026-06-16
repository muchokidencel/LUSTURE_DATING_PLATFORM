import { db } from '../src/db/index.js';
import { users, subscriptions } from '../src/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

async function checkDesync() {
  const now = new Date();
  const subs = await db.query.subscriptions.findMany({
    where: gt(subscriptions.endDate, now)
  });

  console.log(`Found ${subs.length} active subscriptions.`);

  for (const sub of subs) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, sub.userId)
    });

    if (user && user.premiumTier === 'free') {
      console.log(`DESYNC DETECTED: User ${user.id} (${user.email}) has active sub until ${sub.endDate} but premiumTier is 'free'`);
    }
  }
  process.exit(0);
}

checkDesync();
