-- ============================================================
-- LinguaPath — Chat Room Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Denormalise display_name and cefr_level into the table so that
-- Realtime delivers complete messages without extra joins.

CREATE TABLE IF NOT EXISTS chat_room_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language     TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  display_name TEXT        NOT NULL,
  cefr_level   TEXT        NOT NULL,
  content      TEXT        NOT NULL
                           CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_room_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read any message.
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON chat_room_messages;
CREATE POLICY "Authenticated users can read chat messages"
  ON chat_room_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only insert their own messages.
DROP POLICY IF EXISTS "Users insert own chat messages" ON chat_room_messages;
CREATE POLICY "Users insert own chat messages"
  ON chat_room_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages.
DROP POLICY IF EXISTS "Users delete own chat messages" ON chat_room_messages;
CREATE POLICY "Users delete own chat messages"
  ON chat_room_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Index: fast retrieval of the last N messages per language.
CREATE INDEX IF NOT EXISTS idx_chat_room_messages_lang_time
  ON chat_room_messages (language, created_at DESC);

-- Enable Supabase Realtime on this table.
-- If this fails with "publication does not exist", run:
--   CREATE PUBLICATION supabase_realtime;
-- first, then re-run this statement.
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_messages;
