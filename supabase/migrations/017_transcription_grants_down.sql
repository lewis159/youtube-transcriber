-- ============================================================
-- Migration 017 — ROLLBACK / TEARDOWN
-- Reverts 017_transcription_grants.sql completely and cleanly.
-- Drops the transcription_grants table (and its index/RLS, which go
-- with it). Safe to run more than once (IF EXISTS guard).
--
-- NOTE: This restores the schema to its pre-017 shape. It does NOT
-- touch any pre-existing column, table, flag, or status value. The
-- earlier column-based approach (users.bonus_transcriptions) was never
-- applied to any database, so there is nothing else to undo.
-- ============================================================

DROP TABLE IF EXISTS public.transcription_grants;
