import { db } from '../src/db/index.js';
import { users, profiles } from '../src/db/schema.js';
import { eq, ilike } from 'drizzle-orm';

async function check() {
  try {
    const p = await db.query.profiles.findFirst({
      where: ilike(profiles.fullName, '%dencel%')
    });

    if (!p) {
      console.log('Profile not found for "dencel"');
      return;
    }

    const u = await db.query.users.findFirst({
      where: eq(users.id, p.userId)
    });

    if (!u) {
      console.log('User not found for userId', p.userId);
      return;
    }

    console.log('USERS_RESULT:', JSON.stringify({
      id: u.id,
      fullName: p.fullName,
      whatsapp: u.whatsapp,
      instagram: u.instagram
    }, null, 2));

    console.log('PROFILES_RESULT:', JSON.stringify({
      whatsappNumber: p.whatsappNumber,
      instagramUsername: p.instagramUsername
    }, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

check().then(() => process.exit(0));
