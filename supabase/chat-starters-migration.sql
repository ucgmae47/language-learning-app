-- ============================================================
-- LinguaPath — Chat Starters Pre-queue Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- Stores one set of pre-generated personalised conversation starters
-- per user per language.  The row is replaced each time the user opens
-- the chat (so they always get a fresh set on the next visit).

CREATE TABLE IF NOT EXISTS queued_chat_starters (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language   TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  starters   JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, language)
);

ALTER TABLE queued_chat_starters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own chat starters" ON queued_chat_starters;
CREATE POLICY "Users manage own chat starters"
  ON queued_chat_starters FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
