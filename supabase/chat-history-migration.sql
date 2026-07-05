-- Persistent 1-on-1 tutor chat history.
--
-- NOTE: This is separate from chat_room_messages which stores messages in
-- live multi-user chat rooms.  These tables store private sessions between
-- a learner and their AI tutor.

-- ── chat_sessions ─────────────────────────────────────────────────────────────
-- One row per conversation.  Title is auto-set from the first user message.

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language        TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  title           TEXT        NOT NULL DEFAULT 'New conversation',
  message_count   INTEGER     NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
  ON chat_sessions (user_id, language, last_message_at DESC);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sessions" ON chat_sessions;
CREATE POLICY "Users manage own sessions"
  ON chat_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── chat_messages ─────────────────────────────────────────────────────────────
-- One row per message (user or assistant) within a session.

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages (session_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own messages" ON chat_messages;
CREATE POLICY "Users manage own messages"
  ON chat_messages FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
