-- ─── XP & Leveling System V2 (LeetCode Transition) ─────────────

-- 1. Create a function to compute LeetCode Base XP mathematically so the Postgres
-- engine can accurately calculate Base XP without relying on the Node API.
CREATE OR REPLACE FUNCTION calc_leetcode_base_xp(
  p_easy int,
  p_medium int,
  p_hard int,
  p_rating int,
  p_streak int
) RETURNS integer LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_solved_xp integer;
  v_rating_xp integer;
  v_streak_xp integer;
BEGIN
  -- Logarithmic calculation for solved problems
  v_solved_xp := 
    FLOOR(LOG(2, GREATEST(COALESCE(p_easy, 0), 1) + 1) * 3) +
    FLOOR(LOG(2, GREATEST(COALESCE(p_medium, 0), 1) + 1) * 6) +
    FLOOR(LOG(2, GREATEST(COALESCE(p_hard, 0), 1) + 1) * 12);
    
  -- Exponential bonus for contest ratings > 1400
  IF COALESCE(p_rating, 0) > 1400 THEN
    v_rating_xp := FLOOR(POWER((p_rating - 1400)::numeric / 100, 1.5) * 5);
  ELSE
    v_rating_xp := 0;
  END IF;
  
  -- Flat multiplier for streak
  v_streak_xp := FLOOR(COALESCE(p_streak, 0) * 1.5);

  RETURN v_solved_xp + v_rating_xp + v_streak_xp;
END;
$$;

-- 2. Recalculate Base XP globally
DO $$
DECLARE
  r RECORD;
  v_base_xp integer;
  v_engagement_xp integer;
  v_total integer;
  v_level integer;
BEGIN
  FOR r IN SELECT * FROM developers LOOP
    
    -- Leetcode Base XP
    v_base_xp := calc_leetcode_base_xp(
      r.easy_solved,
      r.medium_solved,
      r.hard_solved,
      r.contest_rating,
      r.lc_streak
    );

    -- Engagement XP retroactive estimate
    v_engagement_xp := (
      COALESCE(r.app_streak, 0) * 10 +
      COALESCE(r.dailies_completed, 0) * 25 +
      COALESCE(r.raid_xp, 0) +
      COALESCE(r.referral_count, 0) * 50
    );

    v_total := v_base_xp + v_engagement_xp;

    -- Calculate level
    v_level := 1;
    WHILE v_total >= (25 * POWER(v_level + 1, 2.2))::integer LOOP
      v_level := v_level + 1;
    END LOOP;

    -- Note: reusing `xp_github` to strictly hold the `v_base_xp` so we don't need to alter schema names right now.
    -- The Javascript backend only cares about `xp_total` and `xp_level`.
    UPDATE developers
    SET xp_total = v_total, xp_github = v_base_xp, xp_level = v_level
    WHERE id = r.id;
  END LOOP;
END $$;
