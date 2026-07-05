-- ── Behavioral Interest Engine ────────────────────────────────────────────────
-- Two new tables:
--   user_events  — append-only raw event log (one row per interaction)
--   topic_scores — aggregated confidence per canonical topic per user
--
-- Events flow: app interaction → user_events → aggregateTopicScores() →
--              topic_scores → (threshold met) → genre_interests
-- ──────────────────────────────────────────────────────────────────────────────

-- ── user_events ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language    TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  source      TEXT        NOT NULL,  -- 'news' | 'story' | 'music' | 'journal' | 'recipe' | 'explore' | 'vocabulary'
  event_type  TEXT        NOT NULL,  -- 'article_read' | 'story_completed' | 'song_liked' | 'entry_saved' | ...
  topic       TEXT        NOT NULL,  -- canonical topic (one of the 15 in taxonomy.ts)
  raw_topic   TEXT,                  -- original tag before normalisation (for debugging)
  weight      NUMERIC     NOT NULL,  -- pre-computed points for this event
  duration_s  INTEGER,               -- seconds of dwell (nullable for non-dwell events)
  session_key TEXT,                  -- floor(ts / 30min) — used to detect same-session binges
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_topic
  ON user_events (user_id, topic, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_events_user_lang
  ON user_events (user_id, language, created_at DESC);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own events" ON user_events;
CREATE POLICY "Users manage own events"
  ON user_events FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── topic_scores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_scores (
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language      TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  topic         TEXT        NOT NULL,
  score         NUMERIC     NOT NULL DEFAULT 0,
  event_count   INTEGER     NOT NULL DEFAULT 0,
  distinct_days INTEGER     NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, language, topic)
);

ALTER TABLE topic_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own topic scores" ON topic_scores;
CREATE POLICY "Users manage own topic scores"
  ON topic_scores FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
