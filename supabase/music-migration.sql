-- ============================================================
-- LinguaPath — Music Feature Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS music_likes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  song_title   TEXT        NOT NULL,
  artist       TEXT        NOT NULL,
  genre        TEXT,
  youtube_id   TEXT,
  liked        BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE music_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own music likes" ON music_likes;
CREATE POLICY "Users read own music likes"
  ON music_likes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own music likes" ON music_likes;
CREATE POLICY "Users insert own music likes"
  ON music_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own music likes" ON music_likes;
CREATE POLICY "Users delete own music likes"
  ON music_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_music_likes_user_lang
  ON music_likes (user_id, language, created_at DESC);
