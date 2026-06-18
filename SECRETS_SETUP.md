# Docker Swarm Secrets — Setup for `docker-compose.prod.yml`

The production stack (`yt.bentech.dev`) no longer carries sensitive values as
plaintext environment variables. They are stored as **Docker Swarm secrets**,
declared `external: true` in `docker-compose.prod.yml`, and consumed by the
services that need them.

> **You must create every secret below BEFORE deploying the stack.** Swarm cannot
> auto-create `external` secrets — `docker stack deploy` / Portainer will refuse
> to start the stack until each named secret exists.

---

## Why secrets (not env)

- **Encrypted at rest** in the Swarm Raft log (the managers' internal store).
- **Invisible to `docker inspect`** on the service/container — unlike env vars,
  which `docker inspect` prints in cleartext and which leak into logs and child
  processes.
- **Mounted read-only** as a tmpfs file at `/run/secrets/<name>` only inside the
  containers that explicitly request the secret. Never written to the image or to
  disk on the node.

## How the value reaches the app (the `/run/secrets` → env bridge)

The Next.js app and the Python worker both read configuration from
`process.env` / `os.environ`. To avoid any application code changes, each image
has a small shell **entrypoint** that, at container start, copies every known
`/run/secrets/<file>` into the matching environment variable, then `exec`s the
original start command:

| Image | Entrypoint script | Wired in |
|-------|-------------------|----------|
| app (`youtube-transcriber`) | `deploy/load-secrets-entrypoint.sh` → `/usr/local/bin/load-secrets-entrypoint.sh` | `Dockerfile` `ENTRYPOINT` (CMD `node server.js` unchanged) |
| worker (`youtube-transcriber-worker`) | `whisper-worker/load-secrets-entrypoint.sh` → `/usr/local/bin/load-secrets-entrypoint.sh` | `whisper-worker/Dockerfile` `ENTRYPOINT` (CMD `python worker.py` unchanged) |
| `litellm` | inline `sh -c` `entrypoint:` in the compose file | sources `anthropic_api_key` then `exec litellm …` |
| `redis-primary` / `redis-standby` / `redis-failover` | inline `sh -c` `command:` in the compose file | reads `/run/secrets/redis_password` into `$RP`, passes to `redis-server` |

The entrypoints are **backward compatible**: if a secret file is absent (e.g.
local dev with plain env vars), that mapping is skipped and any pre-existing env
value is left untouched.

Secret-file → env-var mapping used by the app/worker entrypoints:

| Secret (file at `/run/secrets/…`) | Env var exported |
|-----------------------------------|------------------|
| `clerk_secret_key`            | `CLERK_SECRET_KEY` |
| `clerk_webhook_secret`        | `CLERK_WEBHOOK_SECRET` |
| `supabase_service_role_key`   | `SUPABASE_SERVICE_ROLE_KEY` |
| `anthropic_api_key`           | `ANTHROPIC_API_KEY` |
| `redis_password`              | `REDIS_PASSWORD` |
| `stripe_secret_key`           | `STRIPE_SECRET_KEY` |
| `stripe_webhook_secret`       | `STRIPE_WEBHOOK_SECRET` |

---

## The secrets to create

| Secret name | Consumed by | Holds |
|-------------|-------------|-------|
| `clerk_secret_key`          | `app`                                              | Clerk backend secret key (`sk_live_…`) |
| `clerk_webhook_secret`      | `app`                                              | Clerk webhook signing secret (`whsec_…`) |
| `supabase_service_role_key` | `app`, `whisper-worker`                            | Supabase service-role JWT (bypasses RLS) |
| `anthropic_api_key`         | `app`, `litellm`                                   | Anthropic API key (`sk-ant-…`) — hosted-Claude path + LiteLLM fallback |
| `redis_password`            | `app`, `whisper-worker`, `redis-primary`, `redis-standby`, `redis-failover` | Single Redis/Sentinel auth password |
| `stripe_secret_key`         | `app`                                              | Stripe secret key (`sk_live_…`) |
| `stripe_webhook_secret`     | `app`                                              | Stripe webhook signing secret (`whsec_…`) |

> **PENDING — Supabase service_role rotation:** the Supabase `service_role` key
> rotation is still outstanding. Create `supabase_service_role_key` with the
> **NEW** rotated value, not the old one. (To rotate later, see "Rotating a
> secret" below — Swarm secrets are immutable, so rotation = create-new +
> update-service + remove-old.)

---

## Create them via the CLI (`docker secret create`)

Run on a **Swarm manager node**. Piping from `-` reads the value from STDIN so it
never lands in your shell history as an argument. Avoid a trailing newline where
the consumer is strict (use `printf %s`, not `echo`):

```sh
printf %s 'sk_live_XXXXXXXXXXXXXXXX'        | docker secret create clerk_secret_key -
printf %s 'whsec_XXXXXXXXXXXXXXXX'          | docker secret create clerk_webhook_secret -
printf %s 'eyJhbGciOi...NEW_ROTATED_KEY'    | docker secret create supabase_service_role_key -
printf %s 'sk-ant-XXXXXXXXXXXXXXXX'         | docker secret create anthropic_api_key -
printf %s 'super-strong-redis-password'     | docker secret create redis_password -
printf %s 'sk_live_XXXXXXXXXXXXXXXX'         | docker secret create stripe_secret_key -
printf %s 'whsec_XXXXXXXXXXXXXXXX'          | docker secret create stripe_webhook_secret -
```

Or read each from a file (delete the file afterwards):

```sh
docker secret create redis_password ./redis_password.txt && rm -f ./redis_password.txt
```

Verify (names + metadata only — values are never shown):

```sh
docker secret ls
```

## Create them via the Portainer UI

1. In Portainer, select the Swarm environment.
2. Left nav → **Secrets** → **+ Add secret**.
3. **Name** = exactly the secret name from the table above (e.g. `redis_password`).
   Names must match the compose file character-for-character.
4. **Secret** = paste the value. (Portainer also lets you create from a file.)
5. **Create the secret**. Repeat for all seven.
6. Then deploy/redeploy the stack (**Stacks** → the `yt-transcriber` stack →
   re-pull/update). The stack references these as external secrets, so they must
   exist first.

---

## Rotating a secret

Swarm secrets are **immutable** — you cannot edit a value in place. To rotate:

1. Create a new secret under a versioned name, e.g. `redis_password_v2`.
2. Update `docker-compose.prod.yml` to reference the new name (top-level
   `secrets:` + each consuming service), keeping the in-container target/mapping
   the same (or update the entrypoint map if the file name changed).
3. Redeploy the stack (rolling update).
4. `docker secret rm redis_password` once nothing references the old one.

> For `redis_password` specifically, all five Redis-touching services share the
> one secret, so rotate them together in a single redeploy to avoid auth splits
> between primary/standby/sentinel and the clients.

---

## Quick deploy checklist

- [ ] All 7 secrets created (`docker secret ls` shows them).
- [ ] `supabase_service_role_key` holds the **NEW rotated** value.
- [ ] External networks exist: `yt-shared` (NPM ingress) and
      `hermes-agent_hermes-net` (created `--attachable` by the Hermes stack).
- [ ] `docker compose -f docker-compose.prod.yml config -q` passes.
- [ ] Deploy the stack; confirm `app` answers on `/api/ping` and the worker
      connects to Redis (logs show no `NOAUTH`/auth errors).
