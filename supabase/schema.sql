-- ============================================================
-- LinguaPath — Phase 1 Database Schema
-- Run this in the Supabase Dashboard → SQL Editor
-- ============================================================


-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

CREATE TYPE interest_topic AS ENUM (
  'food', 'travel', 'sports', 'technology',
  'culture', 'music', 'film', 'science', 'business', 'history'
);


-- ── profiles ─────────────────────────────────────────────────
-- One row per authenticated user, created automatically on signup.

CREATE TABLE profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  cefr_level    cefr_level  NOT NULL DEFAULT 'B1',
  streak_count  INTEGER     NOT NULL DEFAULT 0,
  stories_read  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ── user_interests ───────────────────────────────────────────
-- Tracks which topics a learner engages with and their relative weight.
-- The AI layer reads this table to personalise story & chat prompts.

CREATE TABLE user_interests (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic      interest_topic NOT NULL,
  weight     FLOAT          NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic)
);

CREATE INDEX user_interests_user_id_idx ON user_interests(user_id);

CREATE TRIGGER user_interests_updated_at
  BEFORE UPDATE ON user_interests
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ── session_metrics ──────────────────────────────────────────
-- One row per user per calendar day — upserted after each learning session.

CREATE TABLE session_metrics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL DEFAULT CURRENT_DATE,
  stories_read    INTEGER     NOT NULL DEFAULT 0,
  quiz_score_avg  FLOAT       CHECK (quiz_score_avg BETWEEN 0 AND 100),
  drills_completed INTEGER    NOT NULL DEFAULT 0,
  chat_turns      INTEGER     NOT NULL DEFAULT 0,
  minutes_active  INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX session_metrics_user_id_date_idx ON session_metrics(user_id, date DESC);


-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- user_interests
CREATE POLICY "Users can view their own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON user_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- session_metrics
CREATE POLICY "Users can view their own metrics"
  ON session_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON session_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
  ON session_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── word_of_day_logs ─────────────────────────────────────────
-- Records which word each user saw on each date.
-- One row per user per day (enforced by unique constraint).

CREATE TABLE word_of_day_logs (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  word     TEXT        NOT NULL,
  seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX word_of_day_logs_user_id_idx ON word_of_day_logs(user_id);

ALTER TABLE word_of_day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own word logs"
  ON word_of_day_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own word logs"
  ON word_of_day_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── stories ──────────────────────────────────────────────────
-- AI-generated Spanish reading passages, personalised per user.
-- The quiz is stored as JSONB alongside the story to avoid a join.

CREATE TABLE stories (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT          NOT NULL,
  body        TEXT          NOT NULL,
  cefr_level  cefr_level    NOT NULL,
  topics      TEXT[]        NOT NULL DEFAULT '{}',
  word_count  INTEGER,
  quiz        JSONB         NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX stories_user_id_created_at_idx ON stories(user_id, created_at DESC);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── story_attempts ───────────────────────────────────────────
-- Records each quiz attempt after a user finishes reading a story.

CREATE TABLE story_attempts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id      UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  score         INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 5),
  answers       JSONB       NOT NULL DEFAULT '{}',
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, story_id)
);

CREATE INDEX story_attempts_user_id_idx ON story_attempts(user_id, completed_at DESC);

ALTER TABLE story_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON story_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON story_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
