-- ============================================================
-- Migration 012 — ROLLBACK / TEARDOWN
-- Reverts 012_ai_provider_pref.sql completely and cleanly.
-- Run this to remove the per-user AI provider preference column.
-- Safe to run more than once (guarded with IF EXISTS).
--
-- NOTE: This restores the schema to its pre-012 shape. It does
-- NOT touch any pre-existing column, table, flag, or status value.
-- ============================================================

-- ── users.ai_provider — drop added column ───────────────────
ALTER TABLE users DROP COLUMN IF EXISTS ai_provider;
