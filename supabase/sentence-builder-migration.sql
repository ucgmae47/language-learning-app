-- Tracks sentence builder attempts for streak / stats purposes
CREATE TABLE IF NOT EXISTS sentence_attempts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language   TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  english    TEXT        NOT NULL,
  target     TEXT        NOT NULL,
  correct    BOOLEAN     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sentence_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sentence attempts"
  ON sentence_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sentence_attempts_user
  ON sentence_attempts (user_id, created_at DESC);
