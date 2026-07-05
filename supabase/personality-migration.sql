-- Adds a personality_traits JSONB column to profiles.
-- The chat personality analyzer writes here after every 5th user message
-- (in an after() background callback) so the tutor can mirror the learner's
-- communication style across all future sessions without any added latency.
--
-- Example stored value:
-- {
--   "tone": "sarcastic",
--   "energy": "high",
--   "depth": "prefers_deep_discussion",
--   "humor": "frequent",
--   "emotional_style": "analytical",
--   "mirror_notes": "Uses irony and understatement. Dislikes over-explanation.",
--   "updated_at": "2026-07-04T22:00:00Z"
-- }

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS personality_traits JSONB;
