import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, likes, matches, notifications, blocks, photos, userPreferences, passes } from '../../db/schema.js';
import { eq, and, or, notInArray, ne, sql, inArray } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { syncUserPremiumStatus } from '../../middleware/sync-premium.js';
import { getDistanceKm } from '../../shared/utils.js';

const router = Router();

router.get('/users', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  console.log(`[DISCOVERY:REQUEST] userId=${userId}, page=${page}`);

  try {
    // Sync and get latest tier
    const currentTier = await syncUserPremiumStatus(userId);


    // Get blocked users
    const blockedList = await db.query.blocks.findMany({
      where: or(
        eq(blocks.blockerId, userId),
        eq(blocks.blockedId, userId)
      )
    });
    const excludedIds = [userId, ...blockedList.map(b => b.blockerId === userId ? b.blockedId : b.blockerId)];

    // Get active user's profile and preferences for distance calculation
    const myProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId)
    });
    const myPrefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId)
    });

    const myLat = myProfile?.latitude;
    const myLng = myProfile?.longitude;
    const maxDistance = myPrefs?.maxDistanceKm ?? 50;

    // Query all non-excluded candidates (no LIMIT/OFFSET here -- distance/city
    // filtering below can drop rows, so pagination has to happen *after*
    // filtering or the reported total/page count would be wrong and pages
    // could come back smaller than pageSize).
    const allUsers = await db.query.users.findMany({
      where: and(
        notInArray(users.id, excludedIds),
        eq(users.ghostMode, false)
      ),
      with: {
        profile: true,
      },
      orderBy: [sql`${users.lastActiveAt} DESC`]
    });

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    let usersWithPhotos = 0;
    const filteredUsers = allUsers.map(u => {
      const p = u.profile;
      const age = p?.birthDate ? Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      
      const normalizedPhotos = normalizePhotos(u.photos);
      if (normalizedPhotos.length > 0) usersWithPhotos++;

      const cLat = p?.latitude;
      const cLng = p?.longitude;
      let distanceKm: number | null = null;
      if (myLat != null && myLng != null && cLat != null && cLng != null) {
        distanceKm = getDistanceKm(myLat, myLng, cLat, cLng);
        if (distanceKm > maxDistance) {
          return null; // Exclude user beyond maximum preferred distance
        }
      } else {
        // Fallback to city string matching when coordinates are not available
        const myCity = (myProfile?.location || '').trim().toLowerCase();
        const candidateCity = (p?.location || '').trim().toLowerCase();
        if (myCity && candidateCity && myCity !== candidateCity) {
          return null; // Exclude user if city doesn't match
        }
      }

      return {
        id: u.id,
        displayName: p?.fullName || 'Anonymous',
        age: age,
        gender: p?.gender,
        city: p?.location || 'Unknown',
        photos: normalizedPhotos,
        bio: p?.bio ? (p.bio.length > 120 ? p.bio.substring(0, 117) + '...' : p.bio) : '',
        isOnline: p?.onlineStatus || false,
        lastActive: u.lastActiveAt,
        isPremium: u.premiumTier !== 'free',
        distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null
      };
    }).filter((u): u is NonNullable<typeof u> => u !== null);

    // Paginate the *filtered* list, so the page returned and the reported
    // total both reflect the same set of eligible candidates.
    const totalCount = filteredUsers.length;
    const formattedUsers = filteredUsers.slice(offset, offset + pageSize);

    console.log(`[PHOTO:SERVE:DISCOVERY] totalReturned=${formattedUsers.length}, usersWithPhotos=${usersWithPhotos}`);
    console.log(`[DISCOVERY:RESULT] totalCount=${totalCount}, returned=${formattedUsers.length}, page=${page}`);

    res.json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error: any) {
    console.error(`[DISCOVERY:ERROR] userId=${userId}:`, error.message);
    res.status(500).json({ message: 'Error fetching discovery users' });
  }
});

import { sendNotification } from '../notifications/notification.service.js';

// ... (rest of imports)

router.post('/like', authenticate, async (req: AuthRequest, res) => {
  const { toUserId, type = 'standard' } = req.body;
  const fromUserId = req.user!.id;

  try {
    const result = await db.execute(sql`
      SELECT process_like_v2(${fromUserId}, ${toUserId}, ${type}) as is_match
    `);

    const isMatch = result.rows[0].is_match;

    if (isMatch) {
      // Use the notification service
      await sendNotification(fromUserId, 'match', 'You have a new match! Start chatting now.');
      await sendNotification(toUserId, 'match', 'Someone liked you back! You have a new match.');

      return res.json({
        status: 'success',
        match: true,
      });
    } else if (type === 'super_like') {
      await sendNotification(toUserId, 'super_like', 'Someone sent you a Super Like!');
    } else {
      const liker = await db.query.users.findFirst({
        where: eq(users.id, fromUserId),
        with: { profile: true }
      });
      const likerName = liker?.profile?.fullName || 'Someone';

      const recipient = await db.query.users.findFirst({
        where: eq(users.id, toUserId)
      });
      const isRecipientPremium = recipient?.premiumTier !== 'free';

      const content = isRecipientPremium
        ? `${likerName} liked your profile!`
        : 'Someone liked your profile! Upgrade to see who.';

      await sendNotification(toUserId, 'like', content);
    }

    res.json({ status: 'success', match: false });
  } catch (error: any) {
    console.error(`[LIKE:ERROR] userId=${fromUserId}:`, error.message);
    res.status(500).json({ message: 'Error processing like' });
  }
});

router.post('/pass', authenticate, async (req: AuthRequest, res) => {
  const { toUserId } = req.body;
  const fromUserId = req.user!.id;

  try {
    console.log(`[DISCOVERY:PASS] userId=${fromUserId}, passedUserId=${toUserId}`);
    
    await db.insert(passes).values({
      userId: fromUserId,
      passedUserId: toUserId,
      isExplicitDislike: true,
      reSurfaceAt: sql`NOW() + INTERVAL '30 days'` // Re-surface in 30 days unless explicit dislike is checked
    }).onConflictDoNothing();

    res.json({ status: 'success' });
  } catch (error: any) {
    console.error(`[PASS:ERROR] userId=${fromUserId}:`, error.message);
    res.status(500).json({ message: 'Error processing pass' });
  }
});

export default router;
