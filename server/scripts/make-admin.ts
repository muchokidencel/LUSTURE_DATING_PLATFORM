
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { eq, or } from 'drizzle-orm';

async function makeAdmin() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.log('Usage: node scripts/make-admin.js <userId or email>');
    process.exit(1);
  }

  const user = await db.query.users.findFirst({
    where: or(
      eq(users.email, identifier),
      isNaN(Number(identifier)) ? undefined : eq(users.id, Number(identifier))
    ),
  });

  if (!user) {
    console.error(`User not found: ${identifier}`);
    process.exit(1);
  }

  await db.update(users)
    .set({ role: 'admin' })
    .where(eq(users.id, user.id));

  console.log(`[ADMIN:PROMOTION] User ${user.email} (ID: ${user.id}) promoted to admin.`);
}

makeAdmin().catch(console.error);
