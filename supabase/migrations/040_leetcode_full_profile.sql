-- Migration 040: Full LeetCode Profile Columns
-- Adds missing LeetCode-specific columns not currently stored in the database

-- ── Streak & Activity ─────────────────────────────────────────
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_max_streak integer DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS total_active_days integer DEFAULT 0;

-- ── Problem Totals ────────────────────────────────────────────
ALTER TABLE developers ADD COLUMN IF NOT EXISTS total_submitted integer DEFAULT 0;

-- ── Contest Stats ─────────────────────────────────────────────
ALTER TABLE developers ADD COLUMN IF NOT EXISTS contests_attended integer DEFAULT 0;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS contest_top_percentage numeric(5,2);  -- e.g. 5.24 means top 5.24%
ALTER TABLE developers ADD COLUMN IF NOT EXISTS contest_badge_name text;              -- e.g. "Guardian", "Knight", "Master"

-- ── Badges ───────────────────────────────────────────────────
-- Stores the most recent/prestigious badge name earned on LeetCode
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_badge text;
-- Store all badge names as an array (jsonb for flexibility)
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_badges_all jsonb DEFAULT '[]'::jsonb;

-- ── Profile Metadata ─────────────────────────────────────────
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_bio text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_country_code text;            -- e.g. "IN", "US"
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_school text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_company text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_website text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_twitter text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_linkedin text;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_github text;

-- ── Problem Category Stats ────────────────────────────────────
-- Top category tags the user is strongest in (jsonb array of {name, count})
ALTER TABLE developers ADD COLUMN IF NOT EXISTS lc_tag_stats jsonb DEFAULT '[]'::jsonb;

-- ── Index for common sorting/filtering ───────────────────────
CREATE INDEX IF NOT EXISTS idx_developers_lc_max_streak ON developers (lc_max_streak DESC);
CREATE INDEX IF NOT EXISTS idx_developers_contest_top_pct ON developers (contest_top_percentage ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_developers_contests_attended ON developers (contests_attended DESC);
CREATE INDEX IF NOT EXISTS idx_developers_total_active_days ON developers (total_active_days DESC);
