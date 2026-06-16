import { db } from '../src/db/index.js';
import { users, profiles, userPreferences } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function fixDesync() {
  console.log('[FIX] Auditing users for missing profiles/preferences...');
  try {
    const allUsers = await db.query.users.findMany({
      with: {
        profile: true,
        preferences: true
      }
    });

    for (const user of allUsers) {
      if (!user.profile) {
        console.log(`[FIX] User ${user.id} (${user.email}) is missing a profile. Creating...`);
        await db.insert(profiles).values({
          userId: user.id,
        });
      }

      if (!user.preferences) {
        console.log(`[FIX] User ${user.id} (${user.email}) is missing preferences. Creating...`);
        await db.insert(userPreferences).values({
          userId: user.id,
          interestedInGenders: [],
        });
      }
    }

    console.log('[FIX] Audit and repair complete.');
  } catch (error) {
    console.error('[FIX] Error during fix:', error);
  }
}

fixDesync().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
