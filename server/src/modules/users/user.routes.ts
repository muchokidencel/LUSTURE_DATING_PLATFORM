import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, photos, likes } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateOptional, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.get('/:id', authenticateOptional, async (req: AuthRequest, res) => {
  const profileUserId = parseInt(req.params.id as string);
  const viewerUserId = req.user?.id;
  console.log(`[PROFILE:VIEW:REQUEST] profileUserId=${profileUserId}, viewerUserId=${viewerUserId || 'anonymous'}`);

  if (isNaN(profileUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, profileUserId),
      with: {
        profile: true,
      }
    });

    if (!user) {
      console.warn(`[PROFILE:VIEW:ERROR] userId=${profileUserId} - User not found`);
      return res.status(404).json({ error: "User not found" });
    }

    let isLikedByMe = false;
    if (viewerUserId) {
      const existingLike = await db.query.likes.findFirst({
        where: and(
          eq(likes.fromUserId, viewerUserId),
          eq(likes.toUserId, profileUserId)
        )
      });
      isLikedByMe = !!existingLike;
      console.log(`[LIKES:IS_LIKED_CHECK] viewerUserId=${viewerUserId}, profileUserId=${profileUserId}, result=${isLikedByMe}`);
    }

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    const finalPhotos = normalizePhotos(user.photos);
    console.log(`[PHOTO:SERVE:PUBLIC_PROFILE] viewedUserId=${profileUserId}, photoCount=${finalPhotos.length}`);

    const p = user.profile;
    const age = p?.birthDate ? Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    const publicData = {
      id: user.id,
      displayName: p?.fullName || 'Anonymous',
      age: age,
      gender: p?.gender,
      city: p?.location || 'Unknown',
      bio: p?.bio || '',
      photos: finalPhotos,
      premiumTier: user.premiumTier,
      isVerified: p?.isVerified || false,
      lastActive: user.lastActiveAt,
      isLikedByMe: isLikedByMe
    };

    console.log(`[PROFILE:VIEW:SUCCESS] userId=${user.id}, displayName=${publicData.displayName}`);
    res.json({
      status: 'success',
      data: publicData
    });
  } catch (error: any) {
    console.error(`[PROFILE:VIEW:ERROR] userId=${profileUserId}, error=${error.message}`);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

export default router;
