import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, likes } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.get('/received', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  console.log(`[LIKES:RECEIVED:REQUEST] userId=${userId}`);

  try {
    const receivedLikes = await db.query.likes.findMany({
      where: eq(likes.toUserId, userId),
      with: {
        fromUser: {
          with: {
            profile: true
          }
        }
      }
    });

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    const likers = receivedLikes.map(l => {
      const u = l.fromUser;
      const p = u.profile;
      const age = p?.birthDate ? Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      return {
        id: u.id,
        displayName: p?.fullName || 'Anonymous',
        age: age,
        gender: p?.gender,
        city: p?.location || 'Unknown',
        photos: normalizePhotos(u.photos),
        premiumTier: u.premiumTier,
        isVerified: p?.isVerified || false,
      };
    });

    console.log(`[LIKES:RECEIVED:RESULT] userId=${userId} count=${likers.length}`);
    res.json({ status: 'success', data: likers });
  } catch (error: any) {
    console.error(`[LIKES:RECEIVED:ERROR] userId=${userId}:`, error);
    res.status(500).json({ message: 'Error fetching received likes' });
  }
});

export default router;
