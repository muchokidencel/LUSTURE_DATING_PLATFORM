-- Create Enums
DO $$ BEGIN
    CREATE TYPE "gender" AS ENUM('male', 'female', 'non_binary', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "orientation" AS ENUM('straight', 'gay', 'bisexual', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "intent" AS ENUM('casual', 'friendship', 'relationship', 'dating', 'friends', 'one_night', 'unspecified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "subscription_status" AS ENUM('active', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "payment_status" AS ENUM('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "premium_tier" AS ENUM('free', 'basic', 'full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "like_type" AS ENUM('standard', 'super');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "notification_event" AS ENUM('match', 'like_batch', 'super_like', 'stale_match', 're_engagement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "referral_status" AS ENUM('pending', 'converted', 'paid', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "earnings_status" AS ENUM('pending', 'available', 'withdrawn', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "withdrawal_status" AS ENUM('requested', 'processing', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Tables

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(20) DEFAULT 'user',
	"is_email_verified" boolean DEFAULT false,
	"referral_code" varchar(50),
	"referred_by" integer,
	"premium_tier" "premium_tier" DEFAULT 'free',
	"token_balance" integer DEFAULT 0,
	"total_earnings" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);

CREATE TABLE IF NOT EXISTS "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"full_name" varchar(255),
	"bio" text,
	"birth_date" timestamp,
	"gender" "gender",
	"orientation" "orientation",
	"interests" text,
	"location" text,
	"location_point" text,
	"is_verified" boolean DEFAULT false,
	"online_status" boolean DEFAULT false,
	"intent" "intent",
	"whatsapp_number" varchar(20),
	"instagram_username" varchar(50),
	"share_whatsapp" boolean DEFAULT false,
	"share_instagram" boolean DEFAULT false,
	"photo_count" integer DEFAULT 0,
	"response_rate" integer DEFAULT 0,
	"profile_completion_score" integer DEFAULT 0,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"interested_in_genders" text[],
	"min_age" integer DEFAULT 18,
	"max_age" integer DEFAULT 100,
	"max_distance_km" integer DEFAULT 50,
	"intent_preference" "intent" DEFAULT 'unspecified'
);

CREATE TABLE IF NOT EXISTS "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"url" text NOT NULL,
	"is_main" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"type" "like_type" DEFAULT 'standard',
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"is_seen" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_one_id" integer NOT NULL,
	"user_two_id" integer NOT NULL,
	"compatibility_score" integer,
	"user_one_reveal_consent" boolean DEFAULT false,
	"user_two_reveal_consent" boolean DEFAULT false,
	"last_interaction_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text,
	"image_url" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" "subscription_status" DEFAULT 'active',
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_ref" varchar(255),
	"status" "payment_status" DEFAULT 'pending',
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_provider_ref_unique" UNIQUE("provider_ref"),
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);

CREATE TABLE IF NOT EXISTS "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_id" integer NOT NULL,
	"status" "referral_status" DEFAULT 'pending',
	"referred_at" timestamp DEFAULT now(),
	"converted_at" timestamp,
	"cooling_ends_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "referrals_referred_id_unique" UNIQUE("referred_id")
);

CREATE TABLE IF NOT EXISTS "affiliate_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'KES',
	"referral_id" integer NOT NULL,
	"status" "earnings_status" DEFAULT 'pending',
	"available_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending',
	"withdrawal_status" "withdrawal_status" DEFAULT 'requested',
	"provider" varchar(50) NOT NULL,
	"provider_ref" varchar(255),
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"payment_method" varchar(50) DEFAULT 'MPESA',
	"payment_reference" varchar(255),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"reported_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_event" NOT NULL,
	"content" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"photo_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Add Foreign Key Constraints

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "likes" ADD CONSTRAINT "likes_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user_one_id_users_id_fk" FOREIGN KEY ("user_one_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user_two_id_users_id_fk" FOREIGN KEY ("user_two_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "affiliate_earnings" ADD CONSTRAINT "affiliate_earnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "affiliate_earnings" ADD CONSTRAINT "affiliate_earnings_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_users_id_fk" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Stored Procedures

CREATE OR REPLACE FUNCTION process_like_v2(
    p_from_id INTEGER,
    p_to_id INTEGER,
    p_type TEXT,
    p_expiry_days INTEGER DEFAULT 14
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_premium BOOLEAN;
    v_daily_likes INTEGER;
    v_mutual_like BOOLEAN;
BEGIN
    SELECT (premium_tier != 'free') INTO v_is_premium FROM users WHERE id = p_from_id;
    
    -- 1. Rate Limiting for Free Tier
    IF NOT v_is_premium AND p_type = 'standard' THEN
        SELECT COUNT(*) INTO v_daily_likes FROM likes 
        WHERE from_user_id = p_from_id AND created_at > (NOW() - INTERVAL '24 hours');
        
        IF v_daily_likes >= 20 THEN
            RAISE EXCEPTION 'Daily like limit reached';
        END IF;
    END IF;

    -- 2. Insert Like with Expiry
    INSERT INTO likes (from_user_id, to_user_id, type, expires_at)
    VALUES (p_from_id, p_to_id, p_type::like_type, NOW() + (p_expiry_days || ' days')::interval)
    ON CONFLICT DO NOTHING;

    -- 3. Check for Mutual Like
    SELECT EXISTS (
        SELECT 1 FROM likes 
        WHERE from_user_id = p_to_id AND to_user_id = p_from_id AND expires_at > NOW()
    ) INTO v_mutual_like;

    IF v_mutual_like THEN
        INSERT INTO matches (user_one_id, user_two_id)
        VALUES (LEAST(p_from_id, p_to_id), GREATEST(p_from_id, p_to_id))
        ON CONFLICT DO NOTHING;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
