-- ============================================================
-- LinguaPath — Translations Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- Adds pre-generated translation columns to the stories table.
-- sentence_translations: ordered JSON array of English sentence translations,
--   one entry per sentence (same split order as the client component).
-- word_translations: JSON object mapping each content word (lowercase) to
--   its concise English meaning.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS sentence_translations JSONB,
  ADD COLUMN IF NOT EXISTS word_translations     JSONB;
