import { pgTable, serial, text, varchar, timestamp, integer, boolean, pgEnum, AnyPgColumn, primaryKey, jsonb, doublePrecision, index } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

export const genderEnum = pgEnum("gender", ["male", "female", "non_binary", "other"]);
export const orientationEnum = pgEnum("orientation", ["straight", "gay", "bisexual", "other"]);
export const intentEnum = pgEnum("intent", ["casual", "friendship", "relationship", "dating", "friends", "one_night", "unspecified"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const premiumTierEnum = pgEnum("premium_tier", ["free", "basic", "full"]);
export const likeTypeEnum = pgEnum("like_type", ["standard", "super"]);
export const notificationEventEnum = pgEnum("notification_event", ["match", "like_batch", "super_like", "stale_match", "re_engagement", "like"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "converted", "paid", "expired"]);
export const earningsStatusEnum = pgEnum("earnings_status", ["pending", "available", "withdrawn", "cancelled"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["requested", "processing", "completed", "rejected"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).default("user"), // 'user' | 'admin'
  isEmailVerified: boolean("is_email_verified").default(false),
  googleId: varchar("google_id", { length: 255 }).unique(),
  authProvider: varchar("auth_provider", { length: 50 }).default("email"), // 'email' | 'google'
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  referredBy: integer("referred_by").references((): AnyPgColumn => users.id),
  premiumTier: premiumTierEnum("premium_tier").default("free"),
  ghostMode: boolean("ghost_mode").default(false),
  tokenBalance: integer("token_balance").default(0),
  totalEarnings: integer("total_earnings").default(0),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  photos: jsonb("photos").array(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
}, (t) => ({
  referredByIdx: index("users_referred_by_idx").on(t.referredBy),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  photosTable: many(photos),
  subscriptions: many(subscriptions),
  payments: many(payments),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  bio: text("bio"),
  birthDate: timestamp("birth_date"), // Replaces age for accurate deal-breaker filtering
  gender: genderEnum("gender"),
  orientation: orientationEnum("orientation"),
  interests: text("interests"),
  location: text("location"),
  locationPoint: text("location_point"), // Placeholder for PostGIS point string
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isVerified: boolean("is_verified").default(false),
  onlineStatus: boolean("online_status").default(false),
  intent: intentEnum("intent"),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  instagramUsername: varchar("instagram_username", { length: 50 }),
  shareWhatsapp: boolean("share_whatsapp").default(false),
  shareInstagram: boolean("share_instagram").default(false),
  photoCount: integer("photo_count").default(0),
  responseRate: integer("response_rate").default(0), // Percentage 0-100
  profileCompletionScore: integer("profile_completion_score").default(0),
  idealSunday: text("ideal_sunday"),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  url: text("url").notNull(),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("photos_user_id_idx").on(t.userId),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}));

export const userPreferences = pgTable("user_preferences", {
  userId: integer("user_id").references(() => users.id).notNull().primaryKey(),
  interestedInGenders: text("interested_in_genders").array(), // Drizzle pg-core array
  minAge: integer("min_age").default(18),
  maxAge: integer("max_age").default(100),
  maxDistanceKm: integer("max_distance_km").default(50),
  intentPreference: intentEnum("intent_preference").default("unspecified"),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  type: likeTypeEnum("type").default("standard"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isSeen: boolean("is_seen").default(false),
}, (t) => ({
  fromUserIdIdx: index("likes_from_user_id_idx").on(t.fromUserId),
  toUserIdIdx: index("likes_to_user_id_idx").on(t.toUserId),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  fromUser: one(users, {
    fields: [likes.fromUserId],
    references: [users.id],
    relationName: 'fromUser'
  }),
  toUser: one(users, {
    fields: [likes.toUserId],
    references: [users.id],
    relationName: 'toUser'
  }),
}));

export const passes = pgTable("passes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  passedUserId: integer("passed_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  reSurfaceAt: timestamp("re_surface_at"),
  isExplicitDislike: boolean("is_explicit_dislike").default(false),
}, (t) => ({
  userIdIdx: index("passes_user_id_idx").on(t.userId),
  passedUserIdIdx: index("passes_passed_user_id_idx").on(t.passedUserId),
}));

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userOneId: integer("user_one_id").references(() => users.id).notNull(),
  userTwoId: integer("user_two_id").references(() => users.id).notNull(),
  compatibilityScore: integer("compatibility_score"),
  userOneRevealConsent: boolean("user_one_reveal_consent").default(false),
  userTwoRevealConsent: boolean("user_two_reveal_consent").default(false),
  lastInteractionAt: timestamp("last_interaction_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userOneIdIdx: index("matches_user_one_id_idx").on(t.userOneId),
  userTwoIdIdx: index("matches_user_two_id_idx").on(t.userTwoId),
}));

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: subscriptionStatusEnum("status").default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("subscriptions_user_id_idx").on(t.userId),
}));

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in KES
  provider: varchar("provider", { length: 50 }).notNull(), // 'mpesa' | 'paystack'
  providerRef: varchar("provider_ref", { length: 255 }).unique(),
  status: paymentStatusEnum("status").default("pending"),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("payments_user_id_idx").on(t.userId),
}));

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("referral_codes_user_id_idx").on(t.userId),
}));

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
  referredId: integer("referred_id").references(() => users.id).notNull().unique(),
  status: referralStatusEnum("status").default("pending"),
  referredAt: timestamp("referred_at").defaultNow(),
  convertedAt: timestamp("converted_at"),
  coolingEndsAt: timestamp("cooling_ends_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  referrerIdIdx: index("referrals_referrer_id_idx").on(t.referrerId),
}));

export const affiliateEarnings = pgTable("affiliate_earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // KES 50
  currency: varchar("currency", { length: 3 }).default("KES"),
  referralId: integer("referral_id").references(() => referrals.id).notNull(),
  status: earningsStatusEnum("status").default("pending"),
  availableAt: timestamp("available_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("affiliate_earnings_user_id_idx").on(t.userId),
  referralIdIdx: index("affiliate_earnings_referral_id_idx").on(t.referralId),
}));

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").default("pending"), // Existing status
  withdrawalStatus: withdrawalStatusEnum("withdrawal_status").default("requested"),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerRef: varchar("provider_ref", { length: 255 }),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("MPESA"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("withdrawals_user_id_idx").on(t.userId),
}));


export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  reportedId: integer("reported_id").references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  reporterIdIdx: index("reports_reporter_id_idx").on(t.reporterId),
  reportedIdIdx: index("reports_reported_id_idx").on(t.reportedId),
}));

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").references(() => users.id).notNull(),
  blockedId: integer("blocked_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  blockerIdIdx: index("blocks_blocker_id_idx").on(t.blockerId),
  blockedIdIdx: index("blocks_blocked_id_idx").on(t.blockedId),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: notificationEventEnum("type").notNull(),
  content: text("content"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("notifications_user_id_idx").on(t.userId),
}));

export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  viewerId: integer("viewer_id").references(() => users.id).notNull(),
  profileId: integer("profile_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  viewerIdIdx: index("profile_views_viewer_id_idx").on(t.viewerId),
  profileIdIdx: index("profile_views_profile_id_idx").on(t.profileId),
}));

export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  userIdIdx: index("verification_requests_user_id_idx").on(t.userId),
}));

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const profileInterests = pgTable("profile_interests", {
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  interestId: integer("interest_id").references(() => interests.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.profileId, t.interestId] }),
}));

export const notificationPreferences = pgTable("notification_preferences", {
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: notificationEventEnum("event_type").notNull(),
  pushEnabled: boolean("push_enabled").default(true),
  emailEnabled: boolean("email_enabled").default(false),
  inAppEnabled: boolean("in_app_enabled").default(true),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.eventType] }),
}));

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  emailIdx: index("email_verification_codes_email_idx").on(t.email),
}));

