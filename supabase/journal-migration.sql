-- ============================================================
-- LinguaPath — Journal Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language    TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  content     TEXT        NOT NULL,
  feedback    JSONB,
  score       INTEGER     CHECK (score >= 0 AND score <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own journal entries" ON journal_entries;
CREATE POLICY "Users manage own journal entries"
  ON journal_entries FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_time
  ON journal_entries (user_id, created_at DESC);
