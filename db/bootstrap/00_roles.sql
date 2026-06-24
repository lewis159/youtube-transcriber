-- =============================================================================
-- 00_roles.sql — Supabase-compatible roles for self-hosted Postgres + PostgREST
-- =============================================================================
-- Recreates the four roles the Supabase platform normally provides, which the
-- app's schema + migrations assume EXIST (e.g. migration 009 GRANTs to
-- service_role). MUST run BEFORE schema.sql and the 001..012 migrations.
--
-- Role model (matches Supabase/PostgREST conventions):
--   authenticator   LOGIN, NOINHERIT — the ONLY login role PostgREST/PgBouncer
--                   use. It owns no privileges itself; it SET ROLEs to one of
--                   the below per request based on the JWT `.role` claim.
--   anon            NOLOGIN — unauthenticated requests (PGRST_DB_ANON_ROLE).
--   authenticated   NOLOGIN — signed-in requests (kept for parity; the app uses
--                   service_role for ~all server-side calls).
--   service_role    NOLOGIN, BYPASSRLS — server-side admin client
--                   (supabaseAdmin). BYPASSRLS so it behaves like Supabase's
--                   service role and the app's RLS-bypassing reads/writes work.
--
-- Run with a superuser:
--   psql "$TARGET_DSN" -v ON_ERROR_STOP=1 \
--        -v authenticator_password="'change-me'" -f db/bootstrap/00_roles.sql
-- (load-schema.sh passes -v authenticator_password from $PG_AUTHENTICATOR_PASSWORD.)
--
-- Idempotent: safe to re-run. Uses DO blocks + IF NOT EXISTS guards.
-- =============================================================================

\set ON_ERROR_STOP on

-- Default the password var so a bare `psql -f` doesn't error (override with -v).
\if :{?authenticator_password}
\else
  \set authenticator_password '''authenticator'''
\endif

-- ── anon ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- ── authenticated ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- ── service_role (BYPASSRLS) ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  ELSE
    -- ensure BYPASSRLS even if a prior run created it without
    ALTER ROLE service_role BYPASSRLS;
  END IF;
END
$$;

-- ── authenticator (the only LOGIN role; NOINHERIT) ────────────────────────────
-- NOTE: psql :'var' substitution does NOT expand inside a DO/$$ block (the server
-- receives the literal ":" → syntax error). So create the role here without a
-- password, then set the password at the TOP LEVEL below where :'var' DOES expand.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;
END
$$;
-- :authenticator_password (RAW, no extra quotes) — the caller passes it already
-- single-quoted via printf "'%s'". Using :'var' here would double-quote it and
-- store the quotes as part of the password (auth then fails).
ALTER ROLE authenticator WITH LOGIN NOINHERIT PASSWORD :authenticator_password;

-- ── authenticator may SET ROLE to each app role ───────────────────────────────
-- GRANT role TO authenticator is idempotent (no-op if already a member).
GRANT anon          TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role  TO authenticator;

-- ── Baseline schema usage ─────────────────────────────────────────────────────
-- service_role gets broad access (it BYPASSRLS anyway). anon/authenticated get
-- USAGE on public; table-level grants come from the migrations' own GRANT/RLS
-- (e.g. migration 009 grants ops.* to service_role). This block only guarantees
-- schema USAGE so PostgREST can introspect.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Make sure the `ops` schema USAGE exists for service_role even before mig 009
-- runs (mig 009 re-grants; harmless to pre-create the schema-less grant target).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'ops') THEN
    GRANT USAGE ON SCHEMA ops TO service_role;
  END IF;
END
$$;

-- PostgREST reloads its schema cache on this NOTIFY (sent after migrations by
-- load-schema.sh). Defined here so the channel is documented in one place.
-- NOTIFY pgrst, 'reload schema';
