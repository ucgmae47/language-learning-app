-- Shared free-tier story library: stories readable by any authenticated user.
-- Personal AI stories keep user_id set; library rows use user_id NULL + is_library TRUE.

ALTER TABLE stories
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS is_library BOOLEAN NOT NULL DEFAULT FALSE;

-- Library catalog index (language + level browsing)
CREATE INDEX IF NOT EXISTS stories_library_lang_cefr_idx
  ON stories (language, cefr_level, created_at DESC)
  WHERE is_library = TRUE;

DROP POLICY IF EXISTS "Users can view their own stories" ON stories;
DROP POLICY IF EXISTS "Users can view own or library stories" ON stories;

CREATE POLICY "Users can view own or library stories"
  ON stories FOR SELECT
  USING (is_library = TRUE OR auth.uid() = user_id);

-- Insert/update remain own-only (library seeds use the service role, which bypasses RLS).
DROP POLICY IF EXISTS "Users can insert their own stories" ON stories;
CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_library = FALSE);

DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id AND is_library = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_library = FALSE);
