-- ============================================================
-- Migration 012: Per-user AI provider preference
-- Created: 2026-06-17
--
-- ADDITIVE / FULLY REVERSIBLE. This migration only adds one
-- column (default 'local') to existing users. It does NOT drop,
-- rename, or change the meaning of any existing column, value,
-- table, or flag. Idempotent via IF NOT EXISTS.
--
-- Rollback: see 012_ai_provider_pref_down.sql
-- ============================================================

-- ── users.ai_provider: per-user AI model preference ─────────
-- Controls which model powers AI summaries + Q&A chat for this
-- user: 'local' (in-house Hermes/Ollama engine) or 'hosted'
-- (Claude). Additive, defaults 'local' so every existing row
-- keeps current behaviour (local default, unchanged).
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'local';

COMMENT ON COLUMN users.ai_provider IS 'Per-user AI model preference for summaries + Q&A chat. Allowed: ''local'' (in-house engine, private/free) | ''hosted'' (Claude, higher quality/paid). Default ''local''.';
