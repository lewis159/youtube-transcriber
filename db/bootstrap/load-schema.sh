#!/usr/bin/env bash
# =============================================================================
# load-schema.sh — load roles + schema + migrations into a TARGET Postgres.
# =============================================================================
# DO NOT run automatically. This is an OPERATOR script, invoked from the cutover
# runbook (DB_MIGRATION_RUNBOOK.md) against the FRESH self-hosted DB only.
#
# It runs, in order:
#   1. db/bootstrap/00_roles.sql            (anon / authenticated / service_role
#                                            / authenticator — must precede mig 009)
#   2. supabase/schema.sql                  (base tables + tier_features seed)
#   3. supabase/migrations/001..012 *.sql   (numeric order, SKIPS *_down.sql)
#
# Each file runs with ON_ERROR_STOP so a failure aborts the whole load.
#
# -----------------------------------------------------------------------------
# USAGE
# -----------------------------------------------------------------------------
#   export TARGET_DSN="postgres://postgres:<PG_SUPERUSER_PASSWORD>@<host>:5432/<PG_DB>"
#   export PG_AUTHENTICATOR_PASSWORD="<same value you set in the stack env>"
#   ./db/bootstrap/load-schema.sh
#
# TARGET_DSN MUST be a SUPERUSER connection to the SELF-HOSTED DB (e.g. the
# `postgres` superuser via haproxy:5432 -> leader). NEVER point this at the
# cloud Supabase project.
#
# Run a one-off psql-capable container on the stack overlay if you don't have a
# local psql:
#   docker run --rm -it --network ytdb_ytdb \
#     -e PGPASSWORD=<PG_SUPERUSER_PASSWORD> \
#     -v "$PWD:/work" -w /work postgres:16-alpine \
#     bash db/bootstrap/load-schema.sh
#   (with TARGET_DSN host = haproxy, port 5432)
# =============================================================================
set -euo pipefail

: "${TARGET_DSN:?Set TARGET_DSN to a SUPERUSER DSN for the SELF-HOSTED db}"
: "${PG_AUTHENTICATOR_PASSWORD:?Set PG_AUTHENTICATOR_PASSWORD (matches stack env)}"

# Resolve repo paths relative to this script (db/bootstrap/ -> repo root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCHEMA_SQL="$REPO_ROOT/supabase/schema.sql"
MIG_DIR="$REPO_ROOT/supabase/migrations"

PSQL=(psql "$TARGET_DSN" -v ON_ERROR_STOP=1 --quiet)

echo ">> [1/3] Roles bootstrap (00_roles.sql)"
"${PSQL[@]}" \
  -v "authenticator_password=$(printf "'%s'" "${PG_AUTHENTICATOR_PASSWORD//\'/\'\'}")" \
  -f "$SCRIPT_DIR/00_roles.sql"

echo ">> [2/3] Base schema (schema.sql)"
"${PSQL[@]}" -f "$SCHEMA_SQL"

echo ">> [3/3] Migrations 001..012 (numeric order, skipping *_down.sql)"
# Sort by the leading numeric prefix; skip rollback files.
mapfile -t MIGRATIONS < <(
  find "$MIG_DIR" -maxdepth 1 -name '[0-9][0-9][0-9]_*.sql' ! -name '*_down.sql' -printf '%f\n' \
    | sort -t_ -k1,1n
)
if [[ ${#MIGRATIONS[@]} -eq 0 ]]; then
  echo "!! No migrations found in $MIG_DIR" >&2
  exit 1
fi
for m in "${MIGRATIONS[@]}"; do
  echo "   - $m"
  "${PSQL[@]}" -f "$MIG_DIR/$m"
done

echo ">> Reloading PostgREST schema cache"
"${PSQL[@]}" -c "NOTIFY pgrst, 'reload schema';" || true

echo ">> DONE. Loaded roles + schema + ${#MIGRATIONS[@]} migrations."
echo "   Migrations applied:"
printf '     %s\n' "${MIGRATIONS[@]}"
