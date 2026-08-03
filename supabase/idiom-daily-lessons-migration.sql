-- Idiom flashcards: one daily lesson per user per language.
-- Progress is persisted so leaving the page resumes the same deck.
-- Nightly cron pre-creates tomorrow's lesson only for users who completed today.

CREATE TABLE IF NOT EXISTS idiom_daily_lessons (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language        TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  lesson_date     DATE        NOT NULL DEFAULT (CURRENT_DATE),
  card_ids        TEXT[]      NOT NULL DEFAULT '{}',
  current_idx     INTEGER     NOT NULL DEFAULT 0,
  known_ids       TEXT[]      NOT NULL DEFAULT '{}',
  review_ids      TEXT[]      NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'studying'
                              CHECK (status IN ('studying', 'quiz', 'completed')),
  quiz_answers    JSONB       NOT NULL DEFAULT '{}',
  quiz_score      INTEGER     CHECK (quiz_score IS NULL OR quiz_score BETWEEN 0 AND 100),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, lesson_date)
);

CREATE INDEX IF NOT EXISTS idiom_daily_lessons_user_date_idx
  ON idiom_daily_lessons (user_id, lesson_date DESC);

CREATE INDEX IF NOT EXISTS idiom_daily_lessons_completed_date_idx
  ON idiom_daily_lessons (lesson_date, status)
  WHERE status = 'completed';

ALTER TABLE idiom_daily_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own idiom lessons" ON idiom_daily_lessons;
CREATE POLICY "Users manage own idiom lessons"
  ON idiom_daily_lessons FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
