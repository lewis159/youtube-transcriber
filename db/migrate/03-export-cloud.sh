#!/usr/bin/env bash
# =============================================================================
# 03-export-cloud.sh — Runbook Step 4 (Export data from cloud, --data-only).
# =============================================================================
# READ-ONLY against the cloud Supabase project. Runs exactly the runbook's
# pg_dump:
#
#   pg_dump "$CLOUD_DSN" \
#     --data-only \
#     --schema=public --schema=ops \
#     --no-owner --no-privileges \
#     --disable-triggers \
#     -f <dumpfile>
#
# Why these flags (per the runbook):
#   --data-only        our schema.sql + migrations own the structure.
#   --disable-triggers keep cloud's ops SEC-/OPS- ref-sequence values verbatim.
#   --no-owner         do not leak cloud role names.
#   --no-privileges
#
# Output: a TIMESTAMPED dump file. Path is printed on stdout (last line) so the
# orchestrator / operator can hand it to 04-restore.sh.
#
# ENV REQUIRED:
#   CLOUD_DSN     read-only connection string to the cloud project
# ENV OPTIONAL:
#   DUMP_DIR      directory for the dump (default: ./db/migrate/dumps)
#   DUMP_FILE     explicit dump path (overrides DUMP_DIR + timestamp naming)
#
# USAGE:
#   ./03-export-cloud.sh
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "Export cloud data --data-only (Runbook Step 4)"

require_env CLOUD_DSN
require_tool pg_dump

# Read-only sanity: this should be the cloud source, not the target.
if [[ "$CLOUD_DSN" != *"supabase.co"* ]]; then
  warn "CLOUD_DSN does not contain 'supabase.co' — confirm this is the cloud SOURCE before exporting."
fi

DUMP_DIR="${DUMP_DIR:-$MIGRATE_DIR/dumps}"
if [[ -n "${DUMP_FILE:-}" ]]; then
  DUMP_PATH="$DUMP_FILE"
  mkdir -p "$(dirname "$DUMP_PATH")"
else
  mkdir -p "$DUMP_DIR"
  DUMP_PATH="$DUMP_DIR/cloud-data-$(date -u +'%Y%m%dT%H%M%SZ').sql"
fi

log "Dumping cloud data (read-only) to: $DUMP_PATH"
pg_dump "$CLOUD_DSN" \
  --data-only \
  --schema=public --schema=ops \
  --no-owner --no-privileges \
  --disable-triggers \
  -f "$DUMP_PATH"

[[ -s "$DUMP_PATH" ]] || die "Dump file is empty: $DUMP_PATH"
log "Export complete ($(wc -c <"$DUMP_PATH") bytes)."

# Last stdout line = the dump path, for the orchestrator/operator to consume.
printf '%s\n' "$DUMP_PATH"
