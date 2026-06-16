import { db } from '../src/db/index.js';
import { likes, profiles, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const userId = 7;
  const receivedLikes = await db.query.likes.findMany({
    where: eq(likes.toUserId, userId),
  });

  for (const l of receivedLikes) {
    const fromUserId = l.fromUserId;
    const fromProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, fromUserId),
    });
    console.log(`Like from User ${fromUserId}: Name=${fromProfile?.fullName}`);
  }
  process.exit(0);
}
run();
