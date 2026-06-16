import { db } from '../src/db/index.js';
import { users, profiles } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

const MALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=600',
];

const FEMALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
];

const NEUTRAL_PORTRAITS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600',
];

async function seedMockPhotos() {
  console.log('--- SEEDING MOCK PHOTOS ---');
  
  const allUsers = await db.query.users.findMany({
    with: {
      profile: true
    }
  });

  console.log(`Found ${allUsers.length} total users in the database.`);

  let maleIndex = 0;
  let femaleIndex = 0;
  let neutralIndex = 0;
  let updatedCount = 0;

  for (const user of allUsers) {
    const profile = user.profile;
    const currentPhotos = (user.photos as any[]) || [];
    
    // Check if the user has a profile and either has no photos or an empty photos array
    if (profile && currentPhotos.length === 0) {
      let mockPhotoUrl = '';
      const gender = profile.gender ? profile.gender.toLowerCase() : 'other';

      if (gender === 'male') {
        mockPhotoUrl = MALE_PORTRAITS[maleIndex % MALE_PORTRAITS.length];
        maleIndex++;
      } else if (gender === 'female') {
        mockPhotoUrl = FEMALE_PORTRAITS[femaleIndex % FEMALE_PORTRAITS.length];
        femaleIndex++;
      } else {
        mockPhotoUrl = NEUTRAL_PORTRAITS[neutralIndex % NEUTRAL_PORTRAITS.length];
        neutralIndex++;
      }

      const mockPhoto = {
        url: mockPhotoUrl,
        public_id: `mock-photo-${user.id}-${Date.now()}`
      };

      console.log(`User ${user.id} (${profile.fullName || user.email}, Gender: ${gender}) -> Seeding with: ${mockPhotoUrl}`);
      
      // Update User table
      await db.update(users)
        .set({ photos: [mockPhoto] })
        .where(eq(users.id, user.id));

      // Update Profile table photoCount
      await db.update(profiles)
        .set({ photoCount: 1 })
        .where(eq(profiles.userId, user.id));

      updatedCount++;
    }
  }

  console.log(`--- SEEDING COMPLETED. Updated ${updatedCount} profiles with mock photos ---`);
  process.exit(0);
}

seedMockPhotos().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
