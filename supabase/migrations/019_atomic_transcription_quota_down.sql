-- ============================================================
-- Migration 019 — ROLLBACK / TEARDOWN
-- Reverts 019_atomic_transcription_quota.sql completely and cleanly.
-- Drops the claim_transcription_slot function. Safe to run more than
-- once (IF EXISTS guard).
--
-- NOTE: This restores the schema to its pre-019 shape. It does NOT
-- touch any pre-existing table, column, flag, or status value. After
-- rollback, the upload route's RPC call will fail — only roll this back
-- together with reverting the application code that calls it.
-- ============================================================

DROP FUNCTION IF EXISTS public.claim_transcription_slot(uuid, text, text, text, int);
