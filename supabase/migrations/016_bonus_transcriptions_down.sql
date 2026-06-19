-- ============================================================
-- Migration 016 — ROLLBACK / TEARDOWN
-- Reverts 016_bonus_transcriptions.sql completely and cleanly.
-- Removes the admin-granted bonus-transcriptions column and its
-- CHECK constraint. Safe to run more than once (IF EXISTS guards).
--
-- NOTE: This restores the schema to its pre-016 shape. It does NOT
-- touch any pre-existing column, table, flag, or status value.
-- ============================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_bonus_transcriptions_nonneg;
ALTER TABLE users DROP COLUMN IF EXISTS bonus_transcriptions;
