-- ============================================================
-- LinguaPath — Phase 2b Migration  (self-contained)
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run even if phase2-migration.sql was not run first.
-- ============================================================

-- 1. Ensure the language column exists on profiles
--    (idempotent — does nothing if already added by phase2-migration.sql)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
  CHECK (language IN ('es', 'fr'));

-- 2. Per-language CEFR profiles table
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

-- Drop the policy first in case this script is re-run
DROP POLICY IF EXISTS "Users manage their own language profiles"
  ON language_profiles;

CREATE POLICY "Users manage their own language profiles"
  ON language_profiles FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_language_profiles_user
  ON language_profiles (user_id);

-- 3. Backfill: copy each existing user's current cefr_level into the new table.
--    We default the language to 'es' here; if profiles.language was already set
--    by phase2-migration.sql and is 'fr', it will be used correctly because the
--    DEFAULT clause above keeps the existing value.
INSERT INTO language_profiles (user_id, language, cefr_level)
SELECT p.id,
       COALESCE(p.language, 'es'),
       p.cefr_level
FROM   profiles p
ON CONFLICT (user_id, language) DO NOTHING;
