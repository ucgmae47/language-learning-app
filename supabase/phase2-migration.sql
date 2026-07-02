-- ============================================================
-- LinguaPath — Phase 2 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add target language to user profiles (default Spanish).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'es'
  CHECK (language IN ('es', 'fr'));
