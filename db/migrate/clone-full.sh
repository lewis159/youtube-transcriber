#!/usr/bin/env bash
# =============================================================================
# clone-full.sh — full clone of the cloud Supabase DB (public + ops) into the
# self-hosted ytdb. OPERATOR-RUN on the host (creds stay in your shell).
#
# Why a full clone (not migration replay): the repo's load-schema.sh replays
# schema.sql + migrations, but schema.sql and 001 both create videos/transcripts
# (001 without IF NOT EXISTS) → conflict. Cloning the live cloud schema+data is
# exact and avoids that. We re-grant the app roles and apply the two RLS
# migrations cloud never got (014, 015).
#
# REQUIRED ENV (export before running; nothing is persisted):
#   CLOUD_HOST      Supabase SESSION POOLER host (IPv4!) — Settings → Database →
#                   Connection string → "Session pooler". Direct (db.<ref>...) is
#                   IPv6-only and unreachable from the host — DO NOT use it.
#                   e.g. aws-0-<region>.pooler.supabase.com
#   CLOUD_USER      e.g. postgres.ygfxzkpkwyqqvibljxpw   (pooler user = postgres.<ref>)
#   CLOUD_PASSWORD  the cloud DB password (raw — special chars like # are fine here,
#                   they're passed via PGPASSWORD, not a URI)
#   CLOUD_PORT      default 5432 (session pooler) — NOT 6543 (transaction pooler)
#   CLOUD_DB        default postgres
#   TARGET_DSN      self-hosted SUPERUSER dsn:
#                   postgres://postgres:<PG_SUPERUSER_PASSWORD>@haproxy:5432/postgres
#   PG_AUTHENTICATOR_PASSWORD   the ytdb stack's authenticator password.
# =============================================================================
set -uo pipefail

: "${CLOUD_HOST:?Set CLOUD_HOST (Supabase SESSION POOLER host, IPv4)}"
: "${CLOUD_USER:?Set CLOUD_USER (e.g. postgres.<project-ref>)}"
: "${CLOUD_PASSWORD:?Set CLOUD_PASSWORD (raw cloud DB password)}"
: "${TARGET_DSN:?Set TARGET_DSN (self-hosted superuser dsn)}"
: "${PG_AUTHENTICATOR_PASSWORD:?Set PG_AUTHENTICATOR_PASSWORD}"
CLOUD_PORT="${CLOUD_PORT:-5432}"
CLOUD_DB="${CLOUD_DB:-postgres}"

case "$TARGET_DSN" in *supabase.co*|*pooler.supabase.com*) echo "FATAL: TARGET_DSN points at cloud; must be the self-hosted DB." >&2; exit 1;; esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Helper: psql against cloud via PGPASSWORD (no URI → no special-char escaping).
cloud_psql() { PGPASSWORD="$CLOUD_PASSWORD" psql -h "$CLOUD_HOST" -p "$CLOUD_PORT" -U "$CLOUD_USER" -d "$CLOUD_DB" "$@"; }

echo ">> [0/5] Pre-flight: cloud reachable?"
if ! cloud_psql -tAc "select 1" >/dev/null 2>&1; then
  echo "FATAL: cannot connect to cloud at $CLOUD_HOST:$CLOUD_PORT as $CLOUD_USER." >&2
  echo "       Use the SESSION POOLER host (IPv4), user postgres.<ref>, port 5432." >&2
  exit 1
fi
echo "   cloud OK"

echo ">> [1/5] Create app roles on target (anon/authenticated/service_role/authenticator)"
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet \
  -v "authenticator_password=$(printf "'%s'" "${PG_AUTHENTICATOR_PASSWORD//\'/\'\'}")" \
  -f "$REPO/db/bootstrap/00_roles.sql" \
  || { echo "FATAL: role bootstrap failed — aborting." >&2; exit 1; }

echo ">> [2/5] Dump cloud (public + ops, schema+data, no owners/privs) -> restore into target"
# ON_ERROR_STOP=0 on restore tolerates benign 'extension already exists'; but we
# REQUIRE pg_dump itself to succeed (PIPESTATUS[0]) — a failed dump aborts here.
PGPASSWORD="$CLOUD_PASSWORD" pg_dump -h "$CLOUD_HOST" -p "$CLOUD_PORT" -U "$CLOUD_USER" -d "$CLOUD_DB" \
    --schema=public --schema=ops --no-owner --no-privileges --no-publications --no-subscriptions \
  | psql "$TARGET_DSN" -v ON_ERROR_STOP=0 --quiet
dump_rc=${PIPESTATUS[0]}
if [ "$dump_rc" -ne 0 ]; then
  echo "FATAL: pg_dump from cloud failed (rc=$dump_rc) — nothing reliable restored. Aborting." >&2
  exit 1
fi

echo ">> [3/5] Re-grant to the app roles (service_role does the work; anon read-only)"
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet <<'SQL'
GRANT USAGE ON SCHEMA public, ops TO anon, authenticated, service_role;
GRANT ALL  ON ALL TABLES    IN SCHEMA public, ops TO service_role;
GRANT ALL  ON ALL SEQUENCES IN SCHEMA public, ops TO service_role;
GRANT ALL  ON ALL FUNCTIONS IN SCHEMA public, ops TO service_role;
GRANT SELECT ON ALL TABLES  IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public, ops GRANT ALL ON TABLES TO service_role;
SQL

echo ">> [4/5] Apply RLS migrations 014 + 015 (cloud never had them)"
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet -f "$REPO/supabase/migrations/014_rls_exposed_tables.sql"
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet -f "$REPO/supabase/migrations/015_rls_bsn_public_read.sql"

echo ">> [5/5] Reload PostgREST + row-count parity check"
psql "$TARGET_DSN" -c "NOTIFY pgrst, 'reload schema';" >/dev/null || true
fail=0
for t in users videos transcripts video_summaries transcription_jobs event_logs \
         tier_features roadmap_items roadmap_comments changelog_entries announcements \
         admin_audit_log organisations org_members video_transcript_text bsn_sources bsn_articles; do
  c=$(cloud_psql -tAc "select count(*) from public.$t" 2>/dev/null || echo NA)
  l=$(psql "$TARGET_DSN" -tAc "select count(*) from public.$t" 2>/dev/null || echo NA)
  if [ "$c" = "$l" ] && [ "$c" != "NA" ]; then ok="OK"; else ok="DIFF"; fail=1; fi
  printf '   %-22s cloud=%-6s local=%-6s %s\n' "$t" "$c" "$l" "$ok"
done
if [ $fail -eq 0 ]; then
  echo ">> DONE. All row counts match. ✅"
else
  echo ">> WARNING: mismatches / NA above — DB is NOT a clean clone. Do NOT flip the app. ❌" >&2
  exit 1
fi
