-- LinguaPath — Vocabulary Bank + SRS Migration
CREATE TABLE IF NOT EXISTS vocabulary_cards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language      TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  word          TEXT        NOT NULL,
  translation   TEXT        NOT NULL,
  context       TEXT,
  source        TEXT        NOT NULL DEFAULT 'manual',
  ease_factor   REAL        NOT NULL DEFAULT 2.5,
  interval_days INTEGER     NOT NULL DEFAULT 1,
  repetitions   INTEGER     NOT NULL DEFAULT 0,
  due_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, word)
);
ALTER TABLE vocabulary_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vocab" ON vocabulary_cards USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_user_lang_due ON vocabulary_cards (user_id, language, due_date);
