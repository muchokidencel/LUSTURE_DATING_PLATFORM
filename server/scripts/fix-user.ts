import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function fixUser(id: number) {
  await db.update(users).set({ premiumTier: 'basic' }).where(eq(users.id, id));
  console.log(`Fixed User ${id} premiumTier to basic`);
  process.exit(0);
}

fixUser(4);
