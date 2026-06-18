#!/usr/bin/env bash
# =============================================================================
# clone-full.sh — full clone of the cloud Supabase DB (public + ops) into the
# self-hosted ytdb. OPERATOR-RUN on the host (creds stay in your shell).
#
# Why a full clone (not migration replay): the repo's load-schema.sh replays
# schema.sql + migrations, but schema.sql and 001 both create videos/transcripts
# (001 without IF NOT EXISTS) → conflict. Cloning the live cloud schema+data is
# exact and avoids that. We only re-grant to the app roles and apply the two RLS
# migrations cloud never got (014, 015).
#
# REQUIRED ENV (export before running; nothing is persisted):
#   CLOUD_DSN   Supabase DIRECT connection string (Settings → Database →
#               "Direct connection", port 5432 — NOT the transaction pooler:6543;
#               pg_dump needs a session connection).
#   TARGET_DSN  self-hosted SUPERUSER dsn, e.g.
#               postgres://postgres:<PG_SUPERUSER_PASSWORD>@haproxy:5432/postgres
#   PG_AUTHENTICATOR_PASSWORD   the ytdb stack's authenticator password.
#
# RUN (on the prod host — Portainer container console or SSH), one-shot container
# on the ytdb overlay so `haproxy` resolves:
#   docker run --rm --network ytdb_ytdb \
#     -e CLOUD_DSN='postgres://postgres:<CLOUD_PW>@db.<ref>.supabase.co:5432/postgres' \
#     -e TARGET_DSN='postgres://postgres:<PG_SUPERUSER_PASSWORD>@haproxy:5432/postgres' \
#     -e PG_AUTHENTICATOR_PASSWORD='<PG_AUTHENTICATOR_PASSWORD>' \
#     postgres:16 bash -c \
#     'apt-get update -qq && apt-get install -y -qq git ca-certificates >/dev/null 2>&1 \
#      && git clone --depth 1 -b master https://github.com/lewis159/youtube-transcriber /r \
#      && bash /r/db/migrate/clone-full.sh'
# =============================================================================
set -uo pipefail

: "${CLOUD_DSN:?Set CLOUD_DSN (Supabase direct connection string)}"
: "${TARGET_DSN:?Set TARGET_DSN (self-hosted superuser dsn)}"
: "${PG_AUTHENTICATOR_PASSWORD:?Set PG_AUTHENTICATOR_PASSWORD}"

# Safety: never let TARGET be cloud; warn if CLOUD doesn't look like Supabase.
case "$TARGET_DSN" in *supabase.co*) echo "FATAL: TARGET_DSN points at cloud; must be the self-hosted DB." >&2; exit 1;; esac
case "$CLOUD_DSN"  in *supabase.co*|*pooler.supabase.com*) : ;; *) echo "WARN: CLOUD_DSN doesn't look like Supabase — confirm it's the cloud SOURCE." >&2;; esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ">> [1/5] Create app roles on target (anon/authenticated/service_role/authenticator)"
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet \
  -v "authenticator_password=$(printf "'%s'" "${PG_AUTHENTICATOR_PASSWORD//\'/\'\'}")" \
  -f "$REPO/db/bootstrap/00_roles.sql"

echo ">> [2/5] Dump cloud (public + ops, schema+data, no owners/privs) -> restore into target"
# ON_ERROR_STOP=0 on restore: tolerate benign 'extension already exists' / unknown
# Supabase-only extensions not present on Spilo. Watch the output for REAL errors.
pg_dump "$CLOUD_DSN" \
    --schema=public --schema=ops \
    --no-owner --no-privileges --no-publications --no-subscriptions \
  | psql "$TARGET_DSN" -v ON_ERROR_STOP=0 --quiet

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
  c=$(psql "$CLOUD_DSN"  -tAc "select count(*) from public.$t" 2>/dev/null || echo NA)
  l=$(psql "$TARGET_DSN" -tAc "select count(*) from public.$t" 2>/dev/null || echo NA)
  ok="OK"; [ "$c" != "$l" ] && { ok="DIFF"; fail=1; }
  printf '   %-22s cloud=%-6s local=%-6s %s\n' "$t" "$c" "$l" "$ok"
done
echo ">> DONE. $( [ $fail -eq 0 ] && echo 'All row counts match.' || echo 'MISMATCHES above — investigate before flipping the app.' )"
