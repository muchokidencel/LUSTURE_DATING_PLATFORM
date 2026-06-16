import { db } from '../src/db/index.js';
import { matches, users, profiles } from '../src/db/schema.js';
import { eq, or } from 'drizzle-orm';

async function run() {
  const userId = 7;
  const userMatches = await db.query.matches.findMany({
    where: or(
      eq(matches.userOneId, userId),
      eq(matches.userTwoId, userId)
    ),
  });

  for (const m of userMatches) {
    const otherUserId = m.userOneId === userId ? m.userTwoId : m.userOneId;
    const otherProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, otherUserId),
    });
    console.log(`Match ${m.id} with User ${otherUserId}: Name=${otherProfile?.fullName}`);
  }
  process.exit(0);
}
run();
