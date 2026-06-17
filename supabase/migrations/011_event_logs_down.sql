-- ============================================================
-- Migration 011 — ROLLBACK / TEARDOWN
-- Reverts 011_event_logs.sql completely and cleanly.
-- Run this to remove the event-logs table and the per-user
-- local-transcription opt-in column.
-- Safe to run more than once (everything guarded with IF EXISTS).
--
-- NOTE: This restores the schema to its pre-011 shape. It does NOT
-- touch any pre-existing column, table, flag, or status value.
-- ============================================================

-- ── 3. users.local_transcription_enabled — drop added column ─
ALTER TABLE users DROP COLUMN IF EXISTS local_transcription_enabled;

-- ── 2/1. Drop the event_logs table (RLS policies + indexes drop with it) ─
DROP TABLE IF EXISTS event_logs;
