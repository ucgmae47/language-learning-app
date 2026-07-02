-- ============================================================
-- LinguaPath — Phase 3 Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Tracks which grammar concepts each user struggles with.
-- error_count / attempt_count gives the error rate used to
-- surface weak-area drills first.
CREATE TABLE IF NOT EXISTS grammar_weaknesses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language       TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  concept        TEXT        NOT NULL,   -- e.g. 'es-preterite-irregular'
  error_count    INTEGER     NOT NULL DEFAULT 0,
  attempt_count  INTEGER     NOT NULL DEFAULT 0,
  last_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, concept)
);

ALTER TABLE grammar_weaknesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own grammar weaknesses"
  ON grammar_weaknesses;

CREATE POLICY "Users manage their own grammar weaknesses"
  ON grammar_weaknesses FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grammar_weaknesses_user
  ON grammar_weaknesses (user_id, language);
