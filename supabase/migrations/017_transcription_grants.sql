-- ============================================================
-- Migration 017: One-time, current-month transcription grants
-- Created: 2026-06-19
--
-- ADDITIVE / FULLY REVERSIBLE. This migration only creates one new
-- table (transcription_grants). It does NOT drop, rename, or change
-- the meaning of any existing column, value, table, or flag.
-- Idempotent via IF NOT EXISTS guards.
--
-- PURPOSE
-- The per-tier MONTHLY transcription quota is enforced in
-- app-ha/app/api/videos/upload/route.ts by counting the user's videos
-- created this calendar month against a hardcoded tier->limit map. This
-- table lets admin/support staff GRANT a user extra transcriptions for
-- the CURRENT calendar month ONLY — e.g. to compensate for failed runs
-- THIS month. A grant is a dated row: it applies to the month named by
-- `period_month` and naturally STOPS applying once the calendar rolls
-- over to the next month (true one-time, not a permanent ongoing bump).
--
-- The effective monthly limit becomes:
--   tier_limit + SUM(amount) WHERE period_month = <first day of this month>
--
-- Each grant is a separate, immutable, auditable row. Corrections are
-- made by inserting a NEGATIVE-amount row (keeping a full audit trail)
-- rather than mutating or deleting an existing grant. Grants/adjustments
-- are also audited via admin_audit_log (logAudit) from the grant API.
--
-- Why a dated table (not a column)?
--   A permanent users.bonus_transcriptions column would bump the quota
--   every month forever. Compensation for a specific month's failures
--   must expire at month rollover. A dated grants table makes "this
--   month only" the natural, automatic behaviour: next month's quota
--   simply finds no rows for the new period_month.
--
-- Rollback: see 017_transcription_grants_down.sql
-- ============================================================

-- ── transcription_grants ────────────────────────────────────
-- One row per grant (or correction). `user_id` stores public.users.id
-- as text (matching how the admin/quota code passes the id); `amount`
-- may be negative for corrections. `period_month` is the FIRST day of
-- the calendar month the grant applies to (e.g. 2026-06-01 for June
-- 2026). `granted_by` is the acting admin's id; `reason` is free text.
CREATE TABLE IF NOT EXISTS public.transcription_grants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,
  amount        int  NOT NULL,
  period_month  date NOT NULL,   -- first day of the month the grant applies to
  reason        text,
  granted_by    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Lookup index: the upload route sums a user's grants for the current
-- period_month on every quota check.
CREATE INDEX IF NOT EXISTS transcription_grants_user_period_idx
  ON public.transcription_grants (user_id, period_month);

-- ── RLS — service-role only ─────────────────────────────────
-- Mirrors the rest of the app (e.g. event_logs, roadmap_comments): RLS
-- is enabled with NO public policies, so all reads/writes go through the
-- service-role client (supabaseAdmin), which bypasses RLS.
ALTER TABLE public.transcription_grants ENABLE ROW LEVEL SECURITY;

-- Explicit table privileges for service_role, consistent with other
-- service-owned tables (see 009_ops_sentinel.sql).
GRANT ALL ON TABLE public.transcription_grants TO service_role;

COMMENT ON TABLE  public.transcription_grants            IS 'One-time, current-month admin/support transcription grants. Effective monthly limit = tier_limit + SUM(amount) for the current period_month. Grants expire automatically at month rollover. Corrections are negative-amount rows. Audited via admin_audit_log.';
COMMENT ON COLUMN public.transcription_grants.user_id      IS 'public.users.id (uuid) stored as text — the user the grant applies to.';
COMMENT ON COLUMN public.transcription_grants.amount       IS 'Extra transcriptions granted for period_month. May be negative for corrections.';
COMMENT ON COLUMN public.transcription_grants.period_month IS 'First day of the calendar month the grant applies to (e.g. 2026-06-01). Grants only count for this month.';
COMMENT ON COLUMN public.transcription_grants.granted_by   IS 'Acting admin''s id (public.users.id as resolved by the grant API).';
COMMENT ON COLUMN public.transcription_grants.reason       IS 'Free-text reason, e.g. "failed jobs on 18 Jun".';
