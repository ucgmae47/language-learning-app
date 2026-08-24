-- Tracks per-user reading progress for library (and personal) stories.
-- percent_read is derived from sentence position; finished marks the end screen.

CREATE TABLE IF NOT EXISTS story_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id        UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  percent_read    INTEGER     NOT NULL DEFAULT 0 CHECK (percent_read BETWEEN 0 AND 100),
  sentence_index  INTEGER     NOT NULL DEFAULT 0 CHECK (sentence_index >= 0),
  finished        BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, story_id)
);

ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own story progress" ON story_progress;
DROP POLICY IF EXISTS "Users can insert their own story progress" ON story_progress;
DROP POLICY IF EXISTS "Users can update their own story progress" ON story_progress;

CREATE POLICY "Users can view their own story progress"
  ON story_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own story progress"
  ON story_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own story progress"
  ON story_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS story_progress_user_updated_idx
  ON story_progress (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS story_progress_user_story_idx
  ON story_progress (user_id, story_id);
