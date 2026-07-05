-- ============================================================
-- LinguaPath — Chat Rooms Redesign Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- Replaces the single global chat with per-room messaging.
-- 1. Drop the old flat messages table
-- 2. Create chat_rooms (metadata + settings)
-- 3. Create new chat_room_messages scoped to a room
-- ============================================================

-- ── 1. Drop old table (no production data to preserve) ───────────────────────
DROP TABLE IF EXISTS chat_room_messages;

-- ── 2. chat_rooms ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Authenticated users can read chat rooms"
  ON chat_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users create own chat rooms" ON chat_rooms;
CREATE POLICY "Users create own chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts update own chat rooms" ON chat_rooms;
CREATE POLICY "Hosts update own chat rooms"
  ON chat_rooms FOR UPDATE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts delete own chat rooms" ON chat_rooms;
CREATE POLICY "Hosts delete own chat rooms"
  ON chat_rooms FOR DELETE
  USING (auth.uid() = host_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_lang_status_expires
  ON chat_rooms (language, status, expires_at DESC);

-- ── 3. chat_room_messages (room-scoped) ───────────────────────────────────────
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
CREATE POLICY "Authenticated users can read chat messages"
  ON chat_room_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users insert own chat messages" ON chat_room_messages;
CREATE POLICY "Users insert own chat messages"
  ON chat_room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own chat messages" ON chat_room_messages;
CREATE POLICY "Users delete own chat messages"
  ON chat_room_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_room_messages_room_time
  ON chat_room_messages (room_id, created_at ASC);

-- ── 4. Enable Realtime on both tables ────────────────────────────────────────
-- If either ADD TABLE fails, run first:
--   CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_messages;
