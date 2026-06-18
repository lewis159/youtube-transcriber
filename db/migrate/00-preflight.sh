#!/usr/bin/env bash
# =============================================================================
# 00-preflight.sh — Runbook Step 0 (Pre-flight).
# =============================================================================
# Read-only. Verifies the operator's environment is ready BEFORE any data is
# touched:
#   * required env vars are set,
#   * required tooling is present (psql, pg_dump, and a JWT minter),
#   * the SELF-HOSTED target DB is reachable (read-only SELECT 1),
#   * the CLOUD source DB is reachable (read-only SELECT 1),
#   * the schema/migration source files exist.
#
# This script NEVER writes to either database. It does NOT verify pgBackRest
# restore (Step 0 item 1) — that is an operator action documented in
# db/pgbackrest/README.md and must be done by hand before cutover.
#
# ENV REQUIRED:
#   TARGET_DSN   superuser DSN to the SELF-HOSTED db (postgres://...@haproxy:5432/PG_DB)
#   CLOUD_DSN    read-only DSN to the CLOUD Supabase project
#   PG_AUTHENTICATOR_PASSWORD   (used later by 01-load-schema.sh; checked here)
#   PGRST_JWT_SECRET            (used later by 02-mint-jwt.sh; checked here)
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "Pre-flight (Runbook Step 0)"

log "Checking required env vars..."
require_env TARGET_DSN CLOUD_DSN PG_AUTHENTICATOR_PASSWORD PGRST_JWT_SECRET

# PGRST_JWT_SECRET must be at least 32 chars (HS256 requirement per the stack).
if [[ "${#PGRST_JWT_SECRET}" -lt 32 ]]; then
  die "PGRST_JWT_SECRET must be at least 32 characters (got ${#PGRST_JWT_SECRET})."
fi

# Guard against accidentally pointing TARGET at cloud, or CLOUD at the target.
if [[ "$TARGET_DSN" == *"supabase.co"* ]]; then
  die "TARGET_DSN looks like a CLOUD Supabase host (*.supabase.co). TARGET must be the SELF-HOSTED db."
fi
if [[ "$CLOUD_DSN" != *"supabase.co"* ]]; then
  warn "CLOUD_DSN does not contain 'supabase.co' — make sure this really is the cloud source."
fi

log "Checking required tooling..."
require_tool psql pg_dump
# JWT minting (02-mint-jwt.sh) needs EITHER node OR python3.
if command -v node >/dev/null 2>&1; then
  log "JWT minter available: node"
elif command -v python3 >/dev/null 2>&1; then
  log "JWT minter available: python3"
else
  die "Need 'node' (with jsonwebtoken) or 'python3' (with pyjwt) for JWT minting — see db/mint-jwt.md."
fi

log "Checking schema/migration source files exist..."
[[ -f "$REPO_ROOT/db/bootstrap/load-schema.sh" ]] || die "Missing db/bootstrap/load-schema.sh"
[[ -f "$REPO_ROOT/db/bootstrap/00_roles.sql" ]]   || die "Missing db/bootstrap/00_roles.sql"
[[ -f "$REPO_ROOT/supabase/schema.sql" ]]          || die "Missing supabase/schema.sql"
[[ -d "$REPO_ROOT/supabase/migrations" ]]          || die "Missing supabase/migrations/ directory"

log "Checking database reachability (read-only)..."
rc=0
db_reachable "SELF-HOSTED target" "$TARGET_DSN" || rc=1
db_reachable "CLOUD source"       "$CLOUD_DSN"   || rc=1
[[ "$rc" -eq 0 ]] || die "One or more databases unreachable (see above)."

warn "Pre-flight does NOT verify the pgBackRest restore test. Confirm a 'pgbackrest restore' has succeeded once (db/pgbackrest/README.md) BEFORE cutover."
log "Pre-flight checks PASSED."
