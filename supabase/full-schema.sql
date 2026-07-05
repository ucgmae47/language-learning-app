-- ============================================================
-- LinguaPath — Complete Schema (all phases, fully idempotent)
-- Run this in Supabase Dashboard → SQL Editor
--
-- Safe to run on a fresh database OR on top of an existing one.
-- Uses IF NOT EXISTS, OR REPLACE, and DROP ... IF EXISTS throughout
-- so nothing breaks if parts are already applied.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE cefr_level AS ENUM ('A1','A2','B1','B2','C1','C2');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE interest_topic AS ENUM (
    'food','travel','sports','technology',
    'culture','music','film','science','business','history'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ══════════════════════════════════════════════════════════════
-- 2. SHARED HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Automatically bumps updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Creates a profile row when a new auth user is inserted.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increments stories_read on a user's profile (called after quiz submit).
CREATE OR REPLACE FUNCTION increment_stories_read(uid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET stories_read = stories_read + 1 WHERE id = uid;
END;
$$;

-- Allows a joining player to append themselves to a pictionary room's
-- players array and initialise their score, bypassing the host-only
-- UPDATE RLS policy via SECURITY DEFINER.
CREATE OR REPLACE FUNCTION join_pictionary_room(
  p_code       TEXT,
  p_player     JSONB,
  p_score_key  TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE pictionary_rooms
  SET
    players    = players    || p_player::jsonb,
    scores     = scores     || jsonb_build_object(p_score_key, 0),
    updated_at = NOW()
  WHERE code = p_code
    AND status = 'lobby';
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- 3. TABLES  (in dependency order)
-- ══════════════════════════════════════════════════════════════

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  cefr_level    cefr_level  NOT NULL DEFAULT 'B1',
  streak_count  INTEGER     NOT NULL DEFAULT 0,
  stories_read  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- language column added in phase 2
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
  CHECK (language IN ('es', 'fr'));

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ── language_profiles ─────────────────────────────────────────
-- Per-language CEFR level (separate from the single-language profiles row).
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

DROP POLICY IF EXISTS "Users manage their own language profiles" ON language_profiles;
CREATE POLICY "Users manage their own language profiles"
  ON language_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_language_profiles_user
  ON language_profiles (user_id);

-- Backfill: copy existing users' cefr_level into language_profiles if not there yet.
INSERT INTO language_profiles (user_id, language, cefr_level)
SELECT p.id, COALESCE(p.language, 'es'), p.cefr_level
FROM   profiles p
ON CONFLICT (user_id, language) DO NOTHING;


-- ── user_interests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_interests (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic      interest_topic NOT NULL,
  weight     FLOAT          NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic)
);

DROP TRIGGER IF EXISTS user_interests_updated_at ON user_interests;
CREATE TRIGGER user_interests_updated_at
  BEFORE UPDATE ON user_interests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interests"   ON user_interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON user_interests;

CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interests"
  ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own interests"
  ON user_interests FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interests"
  ON user_interests FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_interests_user_id_idx ON user_interests(user_id);


-- ── genre_interests ────────────────────────────────────────────
-- Implicit genre preferences learned from story + quiz behaviour.
CREATE TABLE IF NOT EXISTS genre_interests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  genre        TEXT        NOT NULL,
  weight       INTEGER     NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 20),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, genre)
);

ALTER TABLE genre_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own genre interests" ON genre_interests;
CREATE POLICY "Users manage their own genre interests"
  ON genre_interests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_genre_interests_user
  ON genre_interests (user_id, language, weight DESC);


-- ── grammar_weaknesses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grammar_weaknesses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language       TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  concept        TEXT        NOT NULL,
  error_count    INTEGER     NOT NULL DEFAULT 0,
  attempt_count  INTEGER     NOT NULL DEFAULT 0,
  last_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, language, concept)
);

ALTER TABLE grammar_weaknesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own grammar weaknesses" ON grammar_weaknesses;
CREATE POLICY "Users manage their own grammar weaknesses"
  ON grammar_weaknesses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grammar_weaknesses_user
  ON grammar_weaknesses (user_id, language);


-- ── session_metrics ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_metrics (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE        NOT NULL DEFAULT CURRENT_DATE,
  stories_read     INTEGER     NOT NULL DEFAULT 0,
  quiz_score_avg   FLOAT       CHECK (quiz_score_avg BETWEEN 0 AND 100),
  drills_completed INTEGER     NOT NULL DEFAULT 0,
  chat_turns       INTEGER     NOT NULL DEFAULT 0,
  minutes_active   INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own metrics"  ON session_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON session_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON session_metrics;

CREATE POLICY "Users can view their own metrics"
  ON session_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics"
  ON session_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics"
  ON session_metrics FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS session_metrics_user_id_date_idx
  ON session_metrics(user_id, date DESC);


-- ── word_of_day_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_of_day_logs (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  word     TEXT        NOT NULL,
  seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE word_of_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own word logs"   ON word_of_day_logs;
DROP POLICY IF EXISTS "Users can insert their own word logs" ON word_of_day_logs;

CREATE POLICY "Users can view their own word logs"
  ON word_of_day_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own word logs"
  ON word_of_day_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS word_of_day_logs_user_id_idx ON word_of_day_logs(user_id);


-- ── stories ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT        NOT NULL,
  body                  TEXT        NOT NULL,
  cefr_level            cefr_level  NOT NULL,
  topics                TEXT[]      NOT NULL DEFAULT '{}',
  word_count            INTEGER,
  quiz                  JSONB       NOT NULL DEFAULT '[]',
  -- added by translations-migration.sql
  sentence_translations JSONB,
  word_translations     JSONB,
  -- added by story-queue-migration.sql
  is_queued             BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for databases that had the old schema without these columns.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS sentence_translations JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS word_translations     JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_queued BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own stories"   ON stories;
DROP POLICY IF EXISTS "Users can insert their own stories" ON stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON stories;

CREATE POLICY "Users can view their own stories"
  ON stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Needed for translation backfill, is_queued toggling, and queue consumption.
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS stories_user_id_created_at_idx
  ON stories(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_user_queued
  ON stories (user_id, created_at DESC)
  WHERE is_queued = TRUE;


-- ── story_attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS story_attempts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id      UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  score         INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 5),
  answers       JSONB       NOT NULL DEFAULT '{}',
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, story_id)
);

ALTER TABLE story_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attempts"   ON story_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON story_attempts;
DROP POLICY IF EXISTS "Users can upsert their own attempts" ON story_attempts;

CREATE POLICY "Users can view their own attempts"
  ON story_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts"
  ON story_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Needed because saveStoryAttempt uses upsert (INSERT … ON CONFLICT DO UPDATE).
CREATE POLICY "Users can upsert their own attempts"
  ON story_attempts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS story_attempts_user_id_idx
  ON story_attempts(user_id, completed_at DESC);


-- ── journal_entries ────────────────────────────────────────────
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
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_time
  ON journal_entries (user_id, created_at DESC);


-- ── sentence_attempts ──────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users manage own sentence attempts" ON sentence_attempts;
CREATE POLICY "Users manage own sentence attempts"
  ON sentence_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sentence_attempts_user
  ON sentence_attempts (user_id, created_at DESC);


-- ── chat_rooms ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language          TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  name              TEXT        NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  topic             TEXT        NOT NULL DEFAULT 'Free Conversation',
  cefr_level        TEXT        NOT NULL DEFAULT 'B1',
  max_members       INTEGER     NOT NULL DEFAULT 10 CHECK (max_members BETWEEN 2 AND 20),
  expires_at        TIMESTAMPTZ NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  host_display_name TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users create own chat rooms"            ON chat_rooms;
DROP POLICY IF EXISTS "Hosts update own chat rooms"            ON chat_rooms;
DROP POLICY IF EXISTS "Hosts delete own chat rooms"            ON chat_rooms;

CREATE POLICY "Authenticated users can read chat rooms"
  ON chat_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users create own chat rooms"
  ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts update own chat rooms"
  ON chat_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts delete own chat rooms"
  ON chat_rooms FOR DELETE USING (auth.uid() = host_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_lang_status_expires
  ON chat_rooms (language, status, expires_at DESC);


-- ── chat_room_messages ─────────────────────────────────────────
-- Room-scoped messages (the old flat global table was replaced by this one).
CREATE TABLE IF NOT EXISTS chat_room_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  cefr_level   TEXT        NOT NULL,
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON chat_room_messages;
DROP POLICY IF EXISTS "Users insert own chat messages"             ON chat_room_messages;
DROP POLICY IF EXISTS "Users delete own chat messages"             ON chat_room_messages;

CREATE POLICY "Authenticated users can read chat messages"
  ON chat_room_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users insert own chat messages"
  ON chat_room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own chat messages"
  ON chat_room_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_room_messages_room_time
  ON chat_room_messages (room_id, created_at ASC);


-- ── pictionary_rooms ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pictionary_rooms (
  code              TEXT        PRIMARY KEY,
  host_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language          TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  status            TEXT        NOT NULL DEFAULT 'lobby'
                                CHECK (status IN ('lobby', 'playing', 'game_over')),
  players           JSONB       NOT NULL DEFAULT '[]',
  round             INTEGER     NOT NULL DEFAULT 0,
  total_rounds      INTEGER     NOT NULL DEFAULT 5,
  current_drawer_id UUID        REFERENCES auth.users(id),
  word_hint         TEXT,
  word_length       INTEGER,
  word_blanks       TEXT,
  round_ends_at     TIMESTAMPTZ,
  scores            JSONB       NOT NULL DEFAULT '{}',
  drawer_queue      JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pictionary_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read rooms" ON pictionary_rooms;
DROP POLICY IF EXISTS "Host can insert room"               ON pictionary_rooms;
DROP POLICY IF EXISTS "Host can update room"               ON pictionary_rooms;
DROP POLICY IF EXISTS "Host can delete room"               ON pictionary_rooms;

CREATE POLICY "Authenticated users can read rooms"
  ON pictionary_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Host can insert room"
  ON pictionary_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room"
  ON pictionary_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete room"
  ON pictionary_rooms FOR DELETE USING (auth.uid() = host_id);

CREATE INDEX IF NOT EXISTS idx_pictionary_rooms_status
  ON pictionary_rooms (status, created_at DESC);


-- ── pictionary_secrets ─────────────────────────────────────────
-- The actual word to draw — only the current drawer can read it.
CREATE TABLE IF NOT EXISTS pictionary_secrets (
  room_code  TEXT        PRIMARY KEY REFERENCES pictionary_rooms(code) ON DELETE CASCADE,
  word       TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pictionary_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drawer can read their word" ON pictionary_secrets;
DROP POLICY IF EXISTS "Host can upsert word"        ON pictionary_secrets;

CREATE POLICY "Drawer can read their word"
  ON pictionary_secrets FOR SELECT
  USING (
    auth.uid() = (
      SELECT current_drawer_id FROM pictionary_rooms WHERE code = room_code
    )
  );

CREATE POLICY "Host can upsert word"
  ON pictionary_secrets FOR ALL
  USING (
    auth.uid() = (SELECT host_id FROM pictionary_rooms WHERE code = room_code)
  )
  WITH CHECK (
    auth.uid() = (SELECT host_id FROM pictionary_rooms WHERE code = room_code)
  );


-- ── music_likes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS music_likes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  song_title   TEXT        NOT NULL,
  artist       TEXT        NOT NULL,
  genre        TEXT,
  youtube_id   TEXT,
  liked        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE music_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own music likes"   ON music_likes;
DROP POLICY IF EXISTS "Users insert own music likes" ON music_likes;
DROP POLICY IF EXISTS "Users delete own music likes" ON music_likes;

CREATE POLICY "Users read own music likes"
  ON music_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own music likes"
  ON music_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own music likes"
  ON music_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_music_likes_user_lang
  ON music_likes (user_id, language, created_at DESC);


-- ── vocabulary_cards ───────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users manage own vocab" ON vocabulary_cards;
CREATE POLICY "Users manage own vocab"
  ON vocabulary_cards FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vocab_user_lang_due
  ON vocabulary_cards (user_id, language, due_date);


-- ── user_achievements ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT        NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own achievements" ON user_achievements;
CREATE POLICY "Users manage own achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- 4. REALTIME PUBLICATIONS
-- ══════════════════════════════════════════════════════════════
-- Supabase Realtime is used by Chat Rooms and Pictionary.
-- If the publication doesn't exist yet, create it first.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add tables to Realtime (safe to run even if already added — the DO block
-- catches the "already a member" error).

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_messages;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pictionary_rooms;
EXCEPTION WHEN others THEN NULL; END $$;
