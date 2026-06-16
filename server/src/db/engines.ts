import { sql } from 'drizzle-orm';
import { db } from './index.js';

/**
 * MIGRATION SCRIPT: ADVANCED MATCHING ENGINES
 * This script creates the PostGIS extensions and stored functions 
 * required for the Discovery and Ranking pipelines.
 */

export const setupMatchingEngines = async () => {
  console.log('Initializing matching engine functions...');

  try {
    // Note: PostGIS extension must be enabled manually in the database console
    // CREATE EXTENSION IF NOT EXISTS postgis;

    // 1. DISCOVERY ENGINE: Filtering Layer
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_discovery_candidates(
          p_user_id INTEGER,
          p_limit INTEGER DEFAULT 500
      ) RETURNS TABLE (candidate_id INTEGER) AS $$
      DECLARE
          v_my_pref RECORD;
          v_my_profile RECORD;
          v_count INTEGER;
      BEGIN
          -- Get current user's filters
          SELECT * INTO v_my_pref FROM user_preferences WHERE user_id = p_user_id;
          SELECT * INTO v_my_profile FROM profiles WHERE user_id = p_user_id;

          IF NOT FOUND THEN
            RAISE NOTICE '[DISCOVERY:DB] No preferences found for User %. Falling back to global pool.', p_user_id;
            RETURN QUERY SELECT p.user_id FROM profiles p WHERE p.user_id != p_user_id LIMIT p_limit;
            RETURN;
          END IF;

          RAISE NOTICE '[DISCOVERY:DB] Filtering candidates for User % (Gender: %, Preferences: %)', 
            p_user_id, v_my_profile.gender, v_my_pref.interested_in_genders;

          RETURN QUERY
          SELECT p.user_id
          FROM profiles p
          JOIN users u ON u.id = p.user_id
          JOIN user_preferences up ON up.user_id = p.user_id
          WHERE p.user_id != p_user_id
          
          -- HARD FILTERS: Orientation & Gender Matrix
          AND (v_my_profile.gender::text = ANY(up.interested_in_genders) OR up.interested_in_genders IS NULL)
          AND (p.gender::text = ANY(v_my_pref.interested_in_genders) OR v_my_pref.interested_in_genders IS NULL)
          
          -- DEAL-BREAKERS: Age Range
          AND (
            p.birth_date IS NULL OR 
            EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN v_my_pref.min_age AND v_my_pref.max_age
          )
          
          -- EXCLUSIONS
          AND NOT EXISTS (SELECT 1 FROM likes WHERE from_user_id = p_user_id AND to_user_id = p.user_id)
          AND NOT EXISTS (
              SELECT 1 FROM passes 
              WHERE user_id = p_user_id 
              AND passed_user_id = p.user_id 
              AND (is_explicit_dislike = true OR re_surface_at > NOW())
          )
          
          LIMIT p_limit;

          GET DIAGNOSTICS v_count = ROW_COUNT;
          RAISE NOTICE '[DISCOVERY:DB] Found % valid candidates for User %.', v_count, p_user_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. RANKING ENGINE: Scoring Layer
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION rank_discovery_candidates(
          p_user_id INTEGER,
          p_candidate_ids INTEGER[]
      ) RETURNS TABLE (user_id INTEGER, final_score FLOAT) AS $$
      BEGIN
          RAISE NOTICE '[RANKING:DB] Ranking % candidates for User %', array_length(p_candidate_ids, 1), p_user_id;
          
          RETURN QUERY
          SELECT 
              p.user_id,
              (
                  -- Photo Uploaded (High Weight)
                  (CASE WHEN p.photo_count > 0 THEN 30 ELSE 0 END) +
                  
                  -- Bio Length (Medium Weight)
                  (CASE WHEN p.bio IS NOT NULL AND LENGTH(p.bio) > 50 THEN 15 ELSE 5 END) +
                  
                  -- Verification Bonus
                  (CASE WHEN p.is_verified THEN 10 ELSE 0 END) +
                  
                  -- Activity Recency (High Weight)
                  (CASE 
                      WHEN u.last_active_at > (NOW() - INTERVAL '24 hours') THEN 25
                      WHEN u.last_active_at > (NOW() - INTERVAL '7 days') THEN 10
                      ELSE 0 
                  END) +
                  
                  -- Response Rate (High Weight)
                  (p.response_rate::float * 0.2)
              )::FLOAT as final_score
          FROM profiles p
          JOIN users u ON u.id = p.user_id
          WHERE p.user_id = ANY(p_candidate_ids)
          ORDER BY final_score DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. LIKING PROCEDURE
    await db.execute(sql`
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
          
          RAISE NOTICE '[MATCHING:DB] User % liked User % (Type: %, Premium: %)', p_from_id, p_to_id, p_type, v_is_premium;

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
              RAISE NOTICE '[MATCHING:DB] MUTUAL LIKE DETECTED between % and %. Creating match.', p_from_id, p_to_id;
              INSERT INTO matches (user_one_id, user_two_id)
              VALUES (LEAST(p_from_id, p_to_id), GREATEST(p_from_id, p_to_id))
              ON CONFLICT DO NOTHING;
              RETURN TRUE;
          END IF;
          
          RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Matching engines initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize matching engines:', error);
  }
};
