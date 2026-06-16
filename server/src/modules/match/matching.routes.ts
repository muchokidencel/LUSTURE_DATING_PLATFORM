import { Router } from 'express';
import { db } from '../../db/index.js';
import { users, profiles, userPreferences, likes, matches, blocks, photos } from '../../db/schema.js';
import { eq, and, or, notInArray, ne, sql, inArray } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { syncUserPremiumStatus } from '../../middleware/sync-premium.js';
import { getDistanceKm } from '../../shared/utils.js';

const router = Router();

router.get('/recommendations', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    // Sync and get latest tier
    const currentTier = await syncUserPremiumStatus(userId);

    if (!currentTier || currentTier === 'free') {
      console.warn(`[MATCHING:FORBIDDEN] Non-premium user ${userId} attempted to access recommendations (Tier: ${currentTier})`);
      return res.status(403).json({ message: 'Premium subscription required for Recommendations' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const myProfile = user.profile;
    const myPrefs = user.preferences;
    const myCity = myProfile?.location?.toLowerCase() || null;

    console.log(`[MATCHING:REQUEST] userId=${userId}, city=${myCity}, prefs=${JSON.stringify(myPrefs)}`);

    // 1. Exclusions
    const blockedList = await db.query.blocks.findMany({
      where: or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId))
    });
    const likedList = await db.query.likes.findMany({
      where: eq(likes.fromUserId, userId)
    });
    const matchedList = await db.query.matches.findMany({
      where: or(eq(matches.userOneId, userId), eq(matches.userTwoId, userId))
    });

    const excludedIds = new Set<number>();
    excludedIds.add(userId);
    blockedList.forEach(b => excludedIds.add(b.blockerId === userId ? b.blockedId : b.blockerId));
    likedList.forEach(l => excludedIds.add(l.toUserId));
    matchedList.forEach(m => excludedIds.add(m.userOneId === userId ? m.userTwoId : m.userOneId));

    // 2. Fetch Candidate Pool (Filter by gender/age if set)
    const filters = [];
    if (myPrefs?.interestedInGenders && myPrefs.interestedInGenders.length > 0) {
      filters.push(inArray(profiles.gender, myPrefs.interestedInGenders as any));
    }
    // Age filtering: candidate's age must be within my preferred range
    // age = floor(days / 365.25)

    const candidates = await db.query.users.findMany({
      where: and(
        notInArray(users.id, Array.from(excludedIds)),
        eq(users.ghostMode, false)
      ),
      with: {
        profile: true,
        preferences: true
      }
    });

    console.log(`[MATCHING:CANDIDATES] raw candidate count=${candidates.length}`);

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    // 3. Scoring & Radius Filtering
    const scoredCandidates = candidates
      .map(c => {
        const p = c.profile;
        const cp = c.preferences;

        // Age Filter check
        const minAgePref = myPrefs?.minAge ?? 18;
        const maxAgePref = myPrefs?.maxAge ?? 99;
        
        let cAge: number | null = null;
        if (p?.birthDate) {
          cAge = Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }

        // Exclude if candidate's age is out of preferred bounds
        if (cAge != null && (cAge < minAgePref || cAge > maxAgePref)) {
          return null;
        }

        // Gender Filter check
        const interestedGenders = myPrefs?.interestedInGenders; // e.g. ['male', 'female']
        if (interestedGenders && interestedGenders.length > 0 && p?.gender) {
          if (!interestedGenders.includes(p.gender)) {
            return null; // Exclude if candidate gender does not match my preference
          }
        }

        let score = 0;
        const myLat = myProfile?.latitude;
        const myLng = myProfile?.longitude;
        const cLat = p?.latitude;
        const cLng = p?.longitude;
        const maxDistance = myPrefs?.maxDistanceKm ?? 50;

        let distanceKm: number | null = null;

        // Geolocation-based distance matching
        if (myLat != null && myLng != null && cLat != null && cLng != null) {
          distanceKm = getDistanceKm(myLat, myLng, cLat, cLng);
          
          // Filter out candidates beyond preferred distance
          if (distanceKm > maxDistance) {
            return null;
          }

          // Distance Scoring (40 pts max)
          if (distanceKm <= 5) score += 40;
          else if (distanceKm <= 15) score += 30;
          else if (distanceKm <= 30) score += 20;
          else if (distanceKm <= 50) score += 10;
        } else {
          // Fallback to City Match (40 pts)
          const cCity = p?.location?.toLowerCase() || null;
          if (myCity && cCity) {
            if (myCity === cCity) score += 40;
          } else {
            score += 20; // One or both missing -> neutral fallback
          }
        }

        // Profile Completeness (30 pts)
        const cPhotos = normalizePhotos(c.photos);
        if (cPhotos.length > 0) score += 10;
        if (p?.bio && p.bio.length > 10) score += 10;
        if (p?.isVerified) score += 10;

        // Preference Alignment (10 pts)
        if (myPrefs?.intentPreference && p?.intent) {
          if (myPrefs.intentPreference === p.intent) score += 10;
        }

        return {
          ...c,
          totalScore: score,
          distanceKm
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Sort and limit
    const topCandidates = scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50);

    console.log(`[MATCHING:SCORED] Top 5 candidates: ${topCandidates.slice(0, 5).map(c => `${c.id}(${c.totalScore})`).join(', ')}`);
    console.log(`[MATCHING:RESULT] returning ${topCandidates.length} candidates`);

    let usersWithPhotos = 0;
    const formattedResults = topCandidates.map(u => {
      const p = u.profile;
      const age = p?.birthDate ? Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      const normalizedPhotos = normalizePhotos(u.photos);
      if (normalizedPhotos.length > 0) usersWithPhotos++;

      return {
        id: u.id,
        displayName: p?.fullName || 'Anonymous',
        age: age,
        gender: p?.gender,
        city: p?.location || 'Unknown',
        photos: normalizedPhotos,
        bio: p?.bio || '',
        interests: p?.interests ? p.interests.split(',').map(i => i.trim()) : [],
        isOnline: p?.onlineStatus || false,
        lastActive: u.lastActiveAt,
        isPremium: u.premiumTier !== 'free',
        distanceKm: u.distanceKm != null ? Math.round(u.distanceKm * 10) / 10 : null
      };
    });

    console.log(`[PHOTO:SERVE:RECOMMENDATIONS] userId=${userId}, returned=${formattedResults.length}, usersWithPhotos=${usersWithPhotos}`);

    res.json({
      status: 'success',
      data: formattedResults
    });

  } catch (error: any) {
    console.error(`[MATCHING:ERROR] userId=${userId}:`, error.message);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

export default router;
