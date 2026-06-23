-- ============================================================
-- Migration 019: Atomic per-user transcription quota claim
-- Created: 2026-06-23
--
-- ADDITIVE / FULLY REVERSIBLE. Creates ONE new function
-- (public.claim_transcription_slot). It does NOT drop, rename, or
-- change any existing table, column, value, flag, or status.
-- Idempotent via CREATE OR REPLACE FUNCTION.
--
-- PROBLEM
-- The upload route (app-ha/app/api/videos/upload/route.ts) enforced the
-- monthly transcription quota with a non-atomic check-then-act:
--   1. COUNT videos created this calendar month
--   2. compare to the (tier limit + current-month grants)
--   3. later, INSERT the videos row
-- Two concurrent uploads both read the same count in step 1, both pass
-- step 2, and both INSERT in step 3 — letting a user exceed their quota.
--
-- FIX
-- Move the count + compare + insert into a SINGLE transaction inside this
-- SECURITY DEFINER function, serialised per-user with a transaction-scoped
-- advisory lock (pg_advisory_xact_lock) keyed on the user id. Concurrent
-- calls for the SAME user run one-at-a-time; calls for DIFFERENT users do
-- not contend. The lock auto-releases at COMMIT/ROLLBACK, so no leak is
-- possible. The effective limit (tier limit + current-month grants) is
-- computed by the caller and passed in as p_limit; p_limit = NULL means
-- UNLIMITED and the count check is skipped.
--
-- RETURN CONTRACT
--   - On success: the newly-inserted videos row (one row).
--   - On quota exceeded: ZERO rows (caller treats "no row" as a 429).
-- The caller distinguishes the two cases by whether a row came back.
--
-- Rollback: see 019_atomic_transcription_quota_down.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_transcription_slot(
  p_user_id   uuid,
  p_youtube_id text,
  p_title     text,
  p_thumbnail text,
  p_limit     int
)
RETURNS SETOF public.videos
LANGUAGE plpgsql
SECURITY DEFINER
-- Lock down search_path so the SECURITY DEFINER body resolves objects only
-- from trusted schemas (defence against search_path hijacking).
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start_of_month timestamptz;
  v_used           int;
BEGIN
  -- Serialise concurrent claims for THIS user. Transaction-scoped: released
  -- automatically at COMMIT/ROLLBACK. Different users hash to different keys
  -- (best-effort) and do not block each other. Using the two-int form keyed
  -- by a stable hash of the uuid avoids bigint range issues.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Unlimited tier: skip the count check entirely, just insert.
  IF p_limit IS NOT NULL THEN
    -- First day of the CURRENT calendar month (UTC), matching the route's
    -- countVideosThisMonth() window.
    v_start_of_month := date_trunc('month', (now() AT TIME ZONE 'UTC'))
                          AT TIME ZONE 'UTC';

    SELECT count(*)
      INTO v_used
      FROM public.videos
     WHERE user_id = p_user_id
       AND created_at >= v_start_of_month;

    -- Quota exhausted — return ZERO rows. The caller maps this to a 429.
    IF v_used >= p_limit THEN
      RETURN;
    END IF;
  END IF;

  -- Slot available (or unlimited): claim it by inserting the videos row and
  -- return it. The INSERT happens under the same advisory lock + transaction,
  -- so a concurrent claim for this user cannot have slipped in between the
  -- count above and this insert.
  RETURN QUERY
    INSERT INTO public.videos (youtube_id, user_id, title, thumbnail, status)
    VALUES (p_youtube_id, p_user_id, p_title, p_thumbnail, 'pending')
    RETURNING *;
END;
$$;

-- Service-role (supabaseAdmin) is the only caller; revoke the default PUBLIC
-- EXECUTE grant on a SECURITY DEFINER function and grant explicitly, so an
-- anon/authenticated session can never invoke it directly.
REVOKE ALL ON FUNCTION public.claim_transcription_slot(uuid, text, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_transcription_slot(uuid, text, text, text, int) TO service_role;

COMMENT ON FUNCTION public.claim_transcription_slot(uuid, text, text, text, int) IS
  'Atomically claims one monthly transcription slot for a user and inserts the videos row, or returns zero rows if the (tier limit + current-month grants) p_limit is reached. Serialised per-user via pg_advisory_xact_lock. p_limit NULL = unlimited. Service-role only.';
