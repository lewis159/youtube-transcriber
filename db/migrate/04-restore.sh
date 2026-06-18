#!/usr/bin/env bash
# =============================================================================
# 04-restore.sh — Runbook Step 4b + Step 5 (TRUNCATE tier_features, then
#                 restore the cloud dump into the SELF-HOSTED db).
# =============================================================================
# DESTRUCTIVE to the SELF-HOSTED target. Requires explicit confirmation:
# a --confirm flag OR typing the target identifier when prompted.
#
# Performs, in order (matching the runbook):
#   Step 4b)  TRUNCATE public.tier_features  — the cloud dump also carries
#             tier_features rows; migration 005 already seeded it on the target.
#             Truncating first lets the cloud data (live source of truth) win
#             and avoids duplicate/conflicting rows. (The runbook's alternative
#             — filtering tier_features OUT of the dump instead — is NOT done
#             here; we implement the TRUNCATE option it lists first.)
#   Step 5)   psql -v ON_ERROR_STOP=1 -f <dump>   — load the data.
#
# If the plain load hits FK-ordering errors, re-run with REPLICATION_ROLE=1 to
# wrap the file in `SET session_replication_role = replica;` inside a single
# transaction (the runbook's documented fallback; requires the superuser DSN,
# which TARGET_DSN is).
#
# ENV REQUIRED:
#   TARGET_DSN          superuser DSN to the SELF-HOSTED db
#   DUMP_FILE           path to the cloud dump produced by 03-export-cloud.sh
#                       (or pass the path as the first positional arg)
# ENV OPTIONAL:
#   REPLICATION_ROLE=1  use the session_replication_role=replica fallback
#   SKIP_TRUNCATE=1     skip the tier_features TRUNCATE (e.g. if you filtered it
#                       out of the dump instead — the runbook's other option)
#
# USAGE:
#   ./04-restore.sh --confirm /path/to/cloud-data-....sql
#   DUMP_FILE=/path/to/dump.sql ./04-restore.sh      # interactive typed guard
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

CONFIRM="${CONFIRM:-0}"
POSITIONAL_DUMP=""
for arg in "$@"; do
  case "$arg" in
    --confirm) CONFIRM=1 ;;
    -*) die "Unknown flag: $arg" ;;
    *) POSITIONAL_DUMP="$arg" ;;
  esac
done
export CONFIRM

step "Restore cloud dump into SELF-HOSTED db (Runbook Steps 4b + 5)"

require_env TARGET_DSN
require_tool psql

DUMP_FILE="${POSITIONAL_DUMP:-${DUMP_FILE:-}}"
[[ -n "$DUMP_FILE" ]] || die "No dump file given. Pass it as an arg or set DUMP_FILE."
[[ -f "$DUMP_FILE" ]] || die "Dump file not found: $DUMP_FILE"
[[ -s "$DUMP_FILE" ]] || die "Dump file is empty: $DUMP_FILE"

if [[ "$TARGET_DSN" == *"supabase.co"* ]]; then
  die "TARGET_DSN looks like CLOUD (*.supabase.co). Restore must only target the SELF-HOSTED db."
fi

# Destructive: TRUNCATE + bulk load. Guard before anything is written.
confirm_target "$TARGET_DSN"

if [[ "${SKIP_TRUNCATE:-0}" == "1" ]]; then
  warn "SKIP_TRUNCATE=1 — NOT truncating public.tier_features (assuming you filtered it out of the dump)."
else
  log "Step 4b: TRUNCATE public.tier_features (cloud data will win)."
  psql "$TARGET_DSN" -v ON_ERROR_STOP=1 -c "TRUNCATE public.tier_features;"
fi

log "Step 5: restoring data from $DUMP_FILE"
if [[ "${REPLICATION_ROLE:-0}" == "1" ]]; then
  warn "Using session_replication_role=replica fallback (single transaction, FK/trigger ordering safe)."
  {
    printf 'BEGIN;\n'
    printf 'SET session_replication_role = replica;\n'
    cat "$DUMP_FILE"
    printf '\nSET session_replication_role = DEFAULT;\n'
    printf 'COMMIT;\n'
  } | psql "$TARGET_DSN" -v ON_ERROR_STOP=1 -f -
else
  psql "$TARGET_DSN" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"
fi

log "Reloading PostgREST schema cache."
psql "$TARGET_DSN" -c "NOTIFY pgrst, 'reload schema';" || warn "NOTIFY failed (non-fatal)."

log "Restore complete. Run 05-verify.sh next to compare row counts."
