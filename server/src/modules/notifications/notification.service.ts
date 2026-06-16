import { db } from '../../db/index.js';
import { notifications, users, notificationPreferences, notificationEventEnum } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export type NotificationEvent = typeof notificationEventEnum.enumValues[number];

export const sendNotification = async (userId: number, event: NotificationEvent, content: string) => {
  try {
    // 1. Check user preferences
    const pref = await db.query.notificationPreferences.findFirst({
      where: and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.eventType, event)
      )
    });

    // Default to enabled if no preference set
    const isPushEnabled = pref ? pref.pushEnabled : true;
    const isInAppEnabled = pref ? pref.inAppEnabled : true;

    // 2. Check user tier for batching logic
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    const isPremium = user?.premiumTier !== 'free';

    // 3. Logic: Instant vs Batched
    // Instant notifications for Premium or high-priority events (match, super_like, like)
    if (isPremium || event === 'match' || event === 'super_like' || event === 'like') {
      if (isInAppEnabled) {
        await db.insert(notifications).values({
          userId,
          type: event,
          content,
        });
      }
      
      if (isPushEnabled) {
        // Here you would integrate with Firebase/OneSignal
        console.log(`[PUSH] To User ${userId}: ${content}`);
      }
    } else {
      // For free users on low-priority events, we just mark the interaction
      // A background job will later send a "X people liked you today" batch notification
      console.log(`[BATCHED] Event ${event} for Free User ${userId} recorded for summary.`);
    }
  } catch (error) {
    console.error('Notification Error:', error);
  }
};

/**
 * RE-ENGAGEMENT TRIGGER
 * Should be run by a cron job every 24 hours
 */
export const triggerReEngagement = async () => {
  // Find users inactive for > 48h with pending (unseen) likes
  const inactiveUsers = await db.execute(sql`
    SELECT u.id, u.email 
    FROM users u
    JOIN likes l ON l.to_user_id = u.id
    WHERE u.last_active_at < (NOW() - INTERVAL '48 hours')
    AND l.is_seen = false
    GROUP BY u.id
  `);

  for (const row of inactiveUsers.rows as any[]) {
    await sendNotification(
      row.id, 
      're_engagement', 
      "People are interested in you! Open Lustre to see your new likes."
    );
  }
};
