-- ============================================================
-- LinguaPath — Phase 4 Migration: Behavioral Interest Graph
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Tracks implicit genre preferences inferred from user behaviour:
--   • Story genre selected (+3)
--   • Quiz completed for a story in that genre (+1)
--   • Quiz score ≥ 4/5 on a story in that genre (+1 bonus)
-- Separate from the onboarding user_interests table (which uses a fixed enum)
-- so any free-text genre can be tracked without a schema change.

CREATE TABLE IF NOT EXISTS genre_interests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  genre        TEXT        NOT NULL,           -- e.g. 'fantasy', 'mystery'
  weight       INTEGER     NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 20),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, genre)
);

ALTER TABLE genre_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own genre interests" ON genre_interests;
CREATE POLICY "Users manage their own genre interests"
  ON genre_interests FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_genre_interests_user
  ON genre_interests (user_id, language, weight DESC);
