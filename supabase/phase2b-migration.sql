-- ============================================================
-- LinguaPath — Phase 2b Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Per-language CEFR profiles.
-- One row per (user, language) pair — a user who has assessed in both
-- Spanish and French will have two rows here.
CREATE TABLE IF NOT EXISTS language_profiles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language    TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  cefr_level  cefr_level  NOT NULL DEFAULT 'B1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language)
);

ALTER TABLE language_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own language profiles"
  ON language_profiles FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_language_profiles_user
  ON language_profiles (user_id);

-- Backfill existing users: copy their current language + cefr_level into
-- the new table so they don't lose their progress.
INSERT INTO language_profiles (user_id, language, cefr_level)
SELECT id, language, cefr_level
FROM   profiles
ON CONFLICT (user_id, language) DO NOTHING;
