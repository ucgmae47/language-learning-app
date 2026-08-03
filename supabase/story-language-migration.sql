-- ============================================================
-- LinguaPath — Story language column
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- Scopes queued stories per active language so bilingual users
-- receive stories in the language they are currently learning.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
  CHECK (language IN ('es', 'fr'));

CREATE INDEX IF NOT EXISTS stories_user_language_queued_idx
  ON stories (user_id, language, is_queued)
  WHERE is_queued = TRUE;
