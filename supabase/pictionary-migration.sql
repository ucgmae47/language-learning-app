-- ─── Pictionary rooms ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pictionary_rooms (
  code              TEXT        PRIMARY KEY,                     -- 6-char uppercase code
  host_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language          TEXT        NOT NULL CHECK (language IN ('es', 'fr')),
  status            TEXT        NOT NULL DEFAULT 'lobby'
                                CHECK (status IN ('lobby', 'playing', 'game_over')),
  -- JSONB array: [{userId, displayName, cefrLevel}]
  players           JSONB       NOT NULL DEFAULT '[]',
  -- current round state (public)
  round             INTEGER     NOT NULL DEFAULT 0,
  total_rounds      INTEGER     NOT NULL DEFAULT 5,
  current_drawer_id UUID        REFERENCES auth.users(id),
  word_hint         TEXT,       -- English translation, visible to all AFTER round ends
  word_length       INTEGER,    -- letter count, shown to guessers during round
  word_blanks       TEXT,       -- e.g. "_ _ _ _ _" with spaces, shown during round
  round_ends_at     TIMESTAMPTZ,
  -- JSONB map: {userId -> score}
  scores            JSONB       NOT NULL DEFAULT '{}',
  -- drawer order: array of userIds
  drawer_queue      JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pictionary_rooms ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view room metadata (but NOT the word — stored separately)
CREATE POLICY "Authenticated users can read rooms"
  ON pictionary_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only the host can create/update/delete their room
CREATE POLICY "Host can insert room"
  ON pictionary_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room"
  ON pictionary_rooms FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Host can delete room"
  ON pictionary_rooms FOR DELETE
  USING (auth.uid() = host_id);

CREATE INDEX IF NOT EXISTS idx_pictionary_rooms_status
  ON pictionary_rooms (status, created_at DESC);

-- ─── Pictionary secrets (the actual word — only visible to current drawer) ───
CREATE TABLE IF NOT EXISTS pictionary_secrets (
  room_code TEXT        PRIMARY KEY REFERENCES pictionary_rooms(code) ON DELETE CASCADE,
  word      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pictionary_secrets ENABLE ROW LEVEL SECURITY;

-- Only the current drawer of the room can read the word
CREATE POLICY "Drawer can read their word"
  ON pictionary_secrets FOR SELECT
  USING (
    auth.uid() = (
      SELECT current_drawer_id FROM pictionary_rooms WHERE code = room_code
    )
  );

-- Only the room host can write the secret
CREATE POLICY "Host can upsert word"
  ON pictionary_secrets FOR ALL
  USING (
    auth.uid() = (
      SELECT host_id FROM pictionary_rooms WHERE code = room_code
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT host_id FROM pictionary_rooms WHERE code = room_code
    )
  );

-- Enable Realtime on rooms (for state sync) but NOT on secrets
ALTER PUBLICATION supabase_realtime ADD TABLE pictionary_rooms;
