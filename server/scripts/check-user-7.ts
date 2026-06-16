import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const u = await db.query.users.findFirst({ 
    where: eq(users.id, 7), 
    with: { profile: true } 
  });
  console.log(JSON.stringify(u, null, 2));
  process.exit(0);
}
run();
