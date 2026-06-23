#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# load-secrets-entrypoint.sh
#
# Bridges Docker Swarm secrets → process environment, so NO app code changes are
# needed. The Next.js app (and the Python worker, which sources this same script)
# read configuration from process.env / os.environ. Swarm mounts each secret as a
# file at /run/secrets/<name>; this entrypoint copies the contents of each known
# secret file into the matching environment variable, then execs the real command.
#
# BACKWARD COMPATIBLE: if a secret file is absent (e.g. running locally with plain
# env vars, or before the secrets are created in Swarm), that mapping is SKIPPED
# and any pre-existing env value is left untouched. So this is safe whether
# secrets are present or not.
#
# Secrets are mounted read-only at /run/secrets/<name> and are encrypted at rest
# in the Swarm Raft log; they never appear in `docker inspect` or image layers.
# ─────────────────────────────────────────────────────────────────────────────
set -e

# Map of <secret-file-name>:<ENV_VAR_NAME>.
# Add new pairs here as more secrets are migrated.
#
# NOTE: pairs are processed top-to-bottom, so when two files map to the same env
# var the LAST present file wins. `supabase_service_role_key_v3` is the prod
# secret name and is listed after the legacy `supabase_service_role_key` so that,
# if both happen to be mounted, the v3 secret takes precedence.
SECRET_MAP="
clerk_secret_key:CLERK_SECRET_KEY
clerk_webhook_secret:CLERK_WEBHOOK_SECRET
supabase_service_role_key:SUPABASE_SERVICE_ROLE_KEY
supabase_service_role_key_v3:SUPABASE_SERVICE_ROLE_KEY
anthropic_api_key:ANTHROPIC_API_KEY
redis_password:REDIS_PASSWORD
stripe_secret_key:STRIPE_SECRET_KEY
stripe_webhook_secret:STRIPE_WEBHOOK_SECRET
resend_api_key:RESEND_API_KEY
"

SECRETS_DIR="${SECRETS_DIR:-/run/secrets}"

for pair in $SECRET_MAP; do
  # Skip blank lines from the heredoc-style list above.
  [ -z "$pair" ] && continue
  file_name="${pair%%:*}"
  var_name="${pair##*:}"
  secret_path="$SECRETS_DIR/$file_name"
  # Only load when the secret file exists AND is non-empty (`-s`). An absent or
  # empty file is skipped so any pre-existing env value is left untouched.
  if [ -s "$secret_path" ]; then
    # Export the var with the file contents. `cat` (not $(<)) for POSIX sh.
    export "$var_name=$(cat "$secret_path")"
  fi
done

# Hand off to the real container command (CMD args or whatever was passed).
exec "$@"
