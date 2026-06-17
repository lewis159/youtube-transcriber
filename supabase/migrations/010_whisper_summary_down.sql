-- ============================================================
-- Migration 010 — ROLLBACK / TEARDOWN
-- Reverts 010_whisper_summary.sql completely and cleanly.
-- Run this to remove the entire Whisper + AI-summary foundation.
-- Safe to run more than once (everything guarded with IF EXISTS).
--
-- NOTE: This restores the schema to its pre-010 shape. It does NOT
-- touch any pre-existing column, table, flag, or status value.
-- ============================================================

-- ── 6. Remove the three seeded feature flags ────────────────
DELETE FROM tier_features
WHERE feature_key IN ('stt_fallback', 'ai_summary', 'summary_chat');

-- ── 5/4/3. Drop the new tables (RLS policies drop with them) ─
DROP TABLE IF EXISTS video_summaries;
DROP TABLE IF EXISTS transcription_jobs;

-- ── 2. videos.status — restore original comment ─────────────
-- No constraint was added, so nothing to revert structurally.
-- Reset the column comment to its prior (empty) state.
COMMENT ON COLUMN videos.status IS NULL;

-- ── 1. transcripts — drop added columns + comments ──────────
ALTER TABLE transcripts DROP COLUMN IF EXISTS confidence;
ALTER TABLE transcripts DROP COLUMN IF EXISTS detected_language;
ALTER TABLE transcripts DROP COLUMN IF EXISTS engine;
ALTER TABLE transcripts DROP COLUMN IF EXISTS source;
