#!/usr/bin/env bash
# =============================================================================
# 01-load-schema.sh — Runbook Step 2 (Load roles + schema + migrations).
# =============================================================================
# Thin wrapper around the EXISTING, authoritative loader:
#   db/bootstrap/load-schema.sh
# which runs 00_roles.sql -> supabase/schema.sql -> supabase/migrations/*.sql
# (numeric order, skipping *_down.sql) and then NOTIFYs PostgREST to reload.
#
# We do NOT re-implement that logic here — we only:
#   * assert the env the loader needs,
#   * guard against running it against the CLOUD project,
#   * invoke it against the SELF-HOSTED target.
#
# This step is CREATE-ONLY against a FRESH self-hosted DB (roles + empty tables
# + the migration-005 tier_features seed). The loader's SQL is idempotent
# (IF NOT EXISTS guards), but applying it to a NON-fresh DB is the operator's
# call — hence the typed-target / --confirm guard.
#
# ENV REQUIRED:
#   TARGET_DSN                  superuser DSN to the SELF-HOSTED db
#   PG_AUTHENTICATOR_PASSWORD   password for the `authenticator` login role
#                               (must match the stack env)
#
# USAGE:
#   ./01-load-schema.sh [--confirm]
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

CONFIRM="${CONFIRM:-0}"
for arg in "$@"; do
  case "$arg" in
    --confirm) CONFIRM=1 ;;
    *) die "Unknown argument: $arg (only --confirm is accepted)" ;;
  esac
done
export CONFIRM

step "Load roles + schema + migrations (Runbook Step 2)"

require_env TARGET_DSN PG_AUTHENTICATOR_PASSWORD
require_tool psql

if [[ "$TARGET_DSN" == *"supabase.co"* ]]; then
  die "TARGET_DSN looks like CLOUD (*.supabase.co). This loader must only target the SELF-HOSTED db."
fi

LOADER="$REPO_ROOT/db/bootstrap/load-schema.sh"
[[ -f "$LOADER" ]] || die "Existing loader not found: $LOADER"

# Schema load writes to the target (DDL). Guard it.
confirm_target "$TARGET_DSN"

log "Invoking existing loader: $LOADER"
# load-schema.sh reads TARGET_DSN and PG_AUTHENTICATOR_PASSWORD from the env we
# already validated above. It is the single source of truth for ordering.
bash "$LOADER"

log "Schema load complete. Verifying objects (read-only)..."
log "Tables in public:"
psql "$TARGET_DSN" -c '\dt public.*' >&2 || warn "Could not list public tables."
log "Schemas (expect public + ops):"
psql "$TARGET_DSN" -c '\dn' >&2 || warn "Could not list schemas."
log "Roles (expect anon, authenticated, service_role, authenticator):"
psql "$TARGET_DSN" -c '\dg' >&2 || warn "Could not list roles."

log "Step 2 complete."
