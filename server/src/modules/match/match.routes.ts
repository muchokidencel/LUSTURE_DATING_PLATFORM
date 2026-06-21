import { Router } from 'express';
import { db } from '../../db/index.js';
import { matches, profiles, users } from '../../db/schema.js';
import { eq, or, inArray } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  console.log(`[MATCH:READ] Fetching matches for User: ${userId}`);

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const isFullPremium = user?.premiumTier === 'full';
    const isBasicPremium = user?.premiumTier === 'basic' || isFullPremium;

    // Fetch matches
    const userMatches = await db.query.matches.findMany({
      where: or(
        eq(matches.userOneId, userId),
        eq(matches.userTwoId, userId)
      ),
    });

    console.log(`[MATCH:READ] Found ${userMatches.length} matches for User: ${userId}`);

    const otherUserIds = userMatches.map(m => m.userOneId === userId ? m.userTwoId : m.userOneId);

    // Batch both lookups instead of firing 2 queries per match (was 2N round-trips).
    const [otherUsersList, otherProfilesList] = otherUserIds.length > 0
      ? await Promise.all([
          db.query.users.findMany({ where: inArray(users.id, otherUserIds) }),
          db.query.profiles.findMany({ where: inArray(profiles.userId, otherUserIds) }),
        ])
      : [[], []];

    const usersById = new Map(otherUsersList.map(u => [u.id, u]));
    const profilesByUserId = new Map(otherProfilesList.map(p => [p.userId, p]));

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    const matchData = userMatches.map((m) => {
      try {
        const otherUserId = m.userOneId === userId ? m.userTwoId : m.userOneId;
        const otherUser = usersById.get(otherUserId);
        const otherProfile = profilesByUserId.get(otherUserId);

        if (!otherProfile || !otherUser) return null;

        const age = otherProfile.birthDate ? Math.floor((new Date().getTime() - new Date(otherProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

        // Contact links stay hidden until BOTH sides have opted in via /reveal.
        const consentedByMe = m.userOneId === userId ? !!m.userOneRevealConsent : !!m.userTwoRevealConsent;
        const consentedByOther = m.userOneId === userId ? !!m.userTwoRevealConsent : !!m.userOneRevealConsent;
        const isRevealed = consentedByMe && consentedByOther;

        const matchObj = {
          id: m.id,
          isPremium: isBasicPremium,
          consentedByMe,
          consentedByOther,
          otherUser: {
            id: otherProfile.userId, // Standardized to id
            displayName: otherProfile.fullName,
            age: age,
            gender: otherProfile.gender,
            city: otherProfile.location || 'Unknown',
            bio: otherProfile.bio,
            whatsapp: isRevealed ? (otherUser.whatsapp || otherProfile.whatsappNumber || null) : null,
            instagram: isRevealed ? (otherUser.instagram || otherProfile.instagramUsername || null) : null,
            photos: normalizePhotos(otherUser.photos),
            premiumTier: otherUser.premiumTier,
            isVerified: otherProfile.isVerified || false,
          },
        };

        console.log(`[MATCH:CONTACT:REVEAL_STATE] users ${userId} and ${otherUserId} (consentedByMe: ${consentedByMe}, consentedByOther: ${consentedByOther}, revealed: ${isRevealed})`);

        return matchObj;
      } catch (err: any) {
        console.error(`[MATCH:CONTACT:ERROR] Error revealing contact for match ${m.id}: ${err.message}`);
        return null;
      }
    });

    res.json({ status: 'success', data: matchData.filter(m => m !== null) });
  } catch (error) {
    console.error(`[MATCH:READ] Error for User ${userId}:`, error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
});

router.post('/:id/reveal', authenticate, async (req: AuthRequest, res) => {
  const matchId = parseInt(req.params.id as string);
  const userId = req.user!.id;
  console.log(`[MATCH:REVEAL] User ${userId} requesting reveal for Match ${matchId}`);

  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId)
    });

    if (!match || (match.userOneId !== userId && match.userTwoId !== userId)) {
      console.warn(`[MATCH:REVEAL] Match ${matchId} not found or unauthorized for User ${userId}`);
      return res.status(404).json({ message: 'Match not found' });
    }

    // Toggle consent
    if (match.userOneId === userId) {
      await db.update(matches).set({ userOneRevealConsent: true }).where(eq(matches.id, matchId));
    } else {
      await db.update(matches).set({ userTwoRevealConsent: true }).where(eq(matches.id, matchId));
    }

    console.log(`[MATCH:REVEAL] SUCCESS for Match ${matchId}, User ${userId}`);
    res.json({ status: 'success', message: 'Consent recorded' });
  } catch (error) {
    console.error(`[MATCH:REVEAL] Error for Match ${matchId}:`, error);
    res.status(500).json({ message: 'Error updating consent' });
  }
});

export default router;
