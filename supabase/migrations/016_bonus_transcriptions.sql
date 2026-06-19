-- ============================================================
-- Migration 016: Admin-granted bonus transcriptions
-- Created: 2026-06-19
--
-- ADDITIVE / FULLY REVERSIBLE. This migration only:
--   * adds one column to existing users (default 0, NOT NULL),
-- so every existing row keeps current behaviour (no bonus).
-- It does NOT drop, rename, or change the meaning of any existing
-- column, value, table, or flag. Idempotent via IF NOT EXISTS.
--
-- PURPOSE
-- The per-tier MONTHLY transcription quota is enforced in
-- app-ha/app/api/videos/upload/route.ts by counting the user's videos
-- created this calendar month against a hardcoded tier->limit map. This
-- column lets admin/support staff GRANT a user extra transcriptions on
-- top of their tier limit, e.g. to compensate for a platform error.
--
-- The effective monthly limit becomes:  tier_limit + bonus_transcriptions
--
-- Why a column (not credit_transactions)?
--   The monthly quota is a COUNT comparison, not a decrementing balance.
--   `credit_transactions` / users.{subscription,purchased}_credits track a
--   separate credit balance that is NOT wired to the monthly-count quota.
--   A single additive integer maps directly onto the existing count check
--   with no new joins or balance bookkeeping. Adjustments are still fully
--   auditable via admin_audit_log (logAudit) from the grant API.
--
-- Rollback: see 016_bonus_transcriptions_down.sql
-- ============================================================

-- ── users.bonus_transcriptions: admin-granted extra monthly quota ──
-- Additive, defaults 0 so every existing row keeps current behaviour.
-- Added to the per-tier monthly limit when the quota is enforced.
-- A CHECK keeps it non-negative (admins increase quota; never below 0).
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_transcriptions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_bonus_transcriptions_nonneg;
ALTER TABLE users ADD CONSTRAINT users_bonus_transcriptions_nonneg CHECK (bonus_transcriptions >= 0);

COMMENT ON COLUMN users.bonus_transcriptions IS 'Admin/support-granted extra monthly transcriptions, ADDED to the per-tier monthly quota (effective limit = tier_limit + bonus_transcriptions). Default 0. Grants/adjustments are audited via admin_audit_log.';
