# Secret Rotation Runbook — `ytdb` + apps

> **Status:** DRAFT for a focused, unhurried session. These steps mutate **live
> production** DB auth and re-mint the apps' keys. A mistake takes both apps'
> data layer offline. Do this in a maintenance window, with the current values
> backed up and a tested rollback for each step. Nothing here is automated.

**Why rotate:** during the cloud→self-hosted migration, the `ytdb` `PG_*`
passwords, `PGRST_JWT_SECRET`, and the (now-paused) cloud DB password were shown
in plaintext in a chat/working context. They should be considered exposed and
rotated.

---

## 1. Secret inventory — where each is set and consumed

The `ytdb` stack passes passwords via **Portainer stack env** (`${VAR}` in
`docker-compose.db.yml`). Changing a value = edit the stack env **and** restart
the services that read it (Swarm bakes env at container start).

| Secret | Set in | Consumed by | Blast radius if wrong |
|--------|--------|-------------|------------------------|
| `PG_AUTHENTICATOR_PASSWORD` | ytdb stack env | (a) `authenticator` Postgres role pw, (b) `pgbouncer` `DB_PASSWORD`, (c) `postgrest` `PGRST_DB_URI` — **all three must match** | PostgREST can't connect → **all DB access down** for both apps |
| `PGRST_JWT_SECRET` | ytdb stack env (`postgrest`) | Signs/verifies the anon + service JWTs (the apps' "keys") | Old keys rejected → **every request 401** for both apps |
| `SUPABASE_SERVICE_ROLE_KEY` (a JWT signed by the above) | YT app #15 (inline env), YT whisper-worker, Springsteen (`supabase_service_role_key_v2` Docker secret) | server-side `supabaseAdmin` / supabase-py — ~all reads/writes | App can't read/write DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a JWT signed by the above) | **GitHub Actions secret** → **build-baked** into the image (`build-push.yml`) | client-side supabase-js | client anon calls fail; **requires a rebuild to change** |
| `PG_SUPERUSER_PASSWORD` | ytdb stack env → Spilo `PGPASSWORD_SUPERUSER` (patroni-a/-b) | `postgres` superuser (our admin psql, Spilo internals) | admin/psql access; Spilo health |
| `PG_STANDBY_PASSWORD` | ytdb stack env → Spilo `PGPASSWORD_STANDBY` | streaming replication between patroni members | **replication breaks** if mismatched |
| `PG_ADMIN_PASSWORD` | ytdb stack env → Spilo `PGPASSWORD_ADMIN` | Spilo `admin` role | low — admin role only |
| Cloud DB password | Supabase project (now **PAUSED**) | nothing live (both apps migrated off) | low — reset via Supabase dashboard when convenient |

**Key facts established during the 017 deploy** (see also infra memory):
- Apply DDL / `ALTER ROLE` to live `ytdb`: SSH `ubuntu@51.83.7.159` →
  `CID=$(sudo docker ps -qf name=ytdb_patroni | head -1)` →
  `sudo docker exec -i "$CID" sh -c 'PGPASSWORD="$PGPASSWORD_SUPERUSER" psql -h haproxy -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1'`.
  `haproxy:5432` always routes to the writable **leader**.
- After any schema/role change PostgREST needs a restart
  (`sudo docker service update --force ytdb_postgrest`) — `NOTIFY` reload doesn't
  work behind PgBouncer transaction pooling.
- App redeploy: `sudo docker service update --image ghcr.io/lewis159/youtube-transcriber:<full-sha> --with-registry-auth yt-transcriber_app`.
- **Docker secrets are immutable** — to change one, create a new version
  (`…_v3`), point the service at it, then remove the old.

---

## 2. Risk-ordered plan

Do them in this order — least entangled first. Steps A and C are DB-tier only;
step B touches both apps + a rebuild.

1. **Pre-flight** (generate values, back up, window) — §3
2. **Rotation A — `PG_AUTHENTICATOR_PASSWORD`** (DB tier, brief blip) — §4
3. **Rotation B — `PGRST_JWT_SECRET` + re-mint keys**, combined with moving the
   YT service key into a **Docker secret** (the original step 3) — §5
4. **Rotation C — `PG_SUPERUSER` / `PG_STANDBY` / `PG_ADMIN`** (Spilo bootstrap;
   replication care; most uncertain) — §6
5. **Rotation D — cloud DB password** (low, anytime) — §7

> If time/appetite is limited, A + B cover the highest-value exposure (the
> app-facing auth). C can be a separate task; D is low risk while paused.

---

## 3. Pre-flight (no mutations)

1. **Maintenance window.** Both apps will have brief auth blips (seconds for A,
   longer for B because of the rebuild). Pick a low-traffic time.
2. **Back up current values.** Copy the current ytdb stack env (Portainer →
   Stacks → ytdb → Editor → Environment variables) into your password manager:
   `PG_DB, PG_SUPERUSER_PASSWORD, PG_ADMIN_PASSWORD, PG_STANDBY_PASSWORD,
   PG_AUTHENTICATOR_PASSWORD, PGRST_JWT_SECRET`. Also note the current
   `SUPABASE_SERVICE_ROLE_KEY` (YT #15 + worker) and the current
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` GitHub secret value — these are your rollback.
3. **Generate new values** (alphanumeric only — avoids URL-escaping issues in
   `PGRST_DB_URI`):
   ```bash
   # passwords
   for n in AUTHENTICATOR SUPERUSER STANDBY ADMIN; do echo "PG_${n}=$(openssl rand -hex 24)"; done
   # jwt secret (>=32 chars)
   echo "PGRST_JWT_SECRET=$(openssl rand -hex 32)"
   ```
   Store them in the password manager **before** applying anything.
4. **Confirm a recent DB backup exists** (pgBackRest — `db/pgbackrest/`) in case
   a role change goes wrong.
5. **Have SSH + Portainer + GitHub access ready** (you'll touch all three).

---

## 4. Rotation A — `PG_AUTHENTICATOR_PASSWORD`

The role pw, PgBouncer's `DB_PASSWORD`, and PostgREST's `PGRST_DB_URI` password
must all match. A role can only have one password, so a brief auth blip is
unavoidable — keep the gap short by doing 4.2 → 4.3 back-to-back.

**4.1** New value already generated (`$NEW_AUTH`).

**4.2 Change the role password** (on the leader, via the patroni psql pattern):
```bash
sudo docker exec -i "$CID" sh -c 'PGPASSWORD="$PGPASSWORD_SUPERUSER" psql -h haproxy -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1' <<SQL
ALTER ROLE authenticator WITH PASSWORD '$NEW_AUTH';
SQL
```
(From this instant the running pgbouncer/postgrest auth with the OLD pw and will
start failing — proceed immediately to 4.3.)

**4.3 Update stack env + restart the two consumers.**
- Portainer → Stacks → `ytdb` → Editor → set `PG_AUTHENTICATOR_PASSWORD=$NEW_AUTH`
  → **Update the stack**. This recreates `pgbouncer` and `postgrest` with the new
  env. (Both are `start-first`, but they'll briefly fail auth until the new env
  is live — that's the blip.)
- If a stack update is too broad, instead force-recreate just those two on the
  server after editing env:
  `sudo docker service update --force ytdb_pgbouncer && sudo docker service update --force ytdb_postgrest`.

**4.4 Verify.**
```bash
# from a node, service_role query through PostgREST should return a row
curl -s "http://localhost:3001/users?select=id&limit=1" \
  -H "Authorization: Bearer $CURRENT_SERVICE_KEY" | head
```
Both apps' dashboards should load. Check `ytdb_postgrest` logs for auth errors.

**Rollback A:** `ALTER ROLE authenticator WITH PASSWORD '<old>'` + revert the
stack env + restart pgbouncer/postgrest.

---

## 5. Rotation B — `PGRST_JWT_SECRET` + re-mint keys (+ service key → Docker secret)

This is the big one: changing `PGRST_JWT_SECRET` instantly invalidates the old
anon + service JWTs, so **every consumer must switch to the new keys in the same
window**. There is no HS256 dual-secret overlap, so plan for a short outage.
Affected: **YT app #15, YT whisper-worker, Springsteen #20**.

**5.1 Mint the new keys** with the new secret (`db/mint-jwt.md`), from the repo
root where `jsonwebtoken` resolves:
```bash
export PGRST_JWT_SECRET='<NEW_JWT_SECRET>'
NEW_ANON=$(node -e "console.log(require('jsonwebtoken').sign({role:'anon',iss:'supabase'},process.env.PGRST_JWT_SECRET,{algorithm:'HS256'}))")
NEW_SERVICE=$(node -e "console.log(require('jsonwebtoken').sign({role:'service_role',iss:'supabase'},process.env.PGRST_JWT_SECRET,{algorithm:'HS256'}))")
echo "ANON=$NEW_ANON"; echo "SERVICE=$NEW_SERVICE"
```
Decode-check both (`jsonwebtoken.decode`) — expect `{role, iss:'supabase'}`.

**5.2 Stage app-side config (do NOT restart yet):**
- **GitHub secret** `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `$NEW_ANON` (Repo → Settings
  → Secrets → Actions). This is build-baked, so it only takes effect on the
  **next image build** — trigger `build-push.yml` (Actions → Run workflow, or it
  builds on the next `app-ha/**` push). Note the resulting image `:<sha>`.
- **Create new Docker secrets** for the service key (immutable → new version):
  ```bash
  printf '%s' "$NEW_SERVICE" | sudo docker secret create supabase_service_role_key_v3 -
  ```
  (This is also the original "move YT #15 off inline keys" step — YT will now read
  the key from the secret like Springsteen does, via a load-secrets entrypoint.)

**5.3 Flip the DB secret + restart PostgREST:**
- Portainer → ytdb → set `PGRST_JWT_SECRET=<NEW_JWT_SECRET>` → update stack
  (recreates `postgrest`). **From here old keys 401 — move fast through 5.4.**

**5.4 Switch every app consumer to the new keys:**
- **YT app #15**: redeploy onto the newly-built image (new baked anon key) AND
  set `SUPABASE_SERVICE_ROLE_KEY` to the new secret. If moving to a Docker
  secret: add `supabase_service_role_key_v3` to the service + a load-secrets
  entrypoint that exports `SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/…)`.
  `sudo docker service update --image ghcr.io/lewis159/youtube-transcriber:<new-sha> --with-registry-auth --secret-add … yt-transcriber_app`.
- **YT whisper-worker**: same new `SUPABASE_SERVICE_ROLE_KEY` (it has no anon key).
- **Springsteen #20**: repoint the service from `supabase_service_role_key_v2`
  to `…_v3` and redeploy (`--secret-rm …_v2 --secret-add …_v3`, update the
  entrypoint path if the name changed).

**5.5 Verify both apps** (dashboards load, a transcript opens, Springsteen
serves + scrapes). Curl checks with `$NEW_SERVICE` / `$NEW_ANON` per
`db/mint-jwt.md`. Check `/admin/logs` for auth errors.

**5.6 Cleanup:** once stable, `sudo docker secret rm supabase_service_role_key_v2`
(and remove any inline `SUPABASE_SERVICE_ROLE_KEY` left in YT #15's stack env).

**Rollback B:** revert `PGRST_JWT_SECRET` to the old value + restart postgrest +
point apps back at the OLD keys (revert GitHub secret + rebuild, or redeploy the
prior image `:<old-sha>`; re-add the old service secret). Keep the old image sha
and old keys until B is confirmed.

---

## 6. Rotation C — `PG_SUPERUSER` / `PG_STANDBY` / `PG_ADMIN` (Spilo)

These run on **`ghcr.io/zalando/spilo-16`** under Patroni. The procedure below is
what we **proved live** on this build — it corrects the earlier "just restart and
Spilo applies `PGPASSWORD_*`" assumption.

⚠️ **Key fact: an env-restart alone is a no-op for the actual roles.** Updating
the `PGPASSWORD_*` env (via `PG_SUPERUSER_PASSWORD` / `PG_STANDBY_PASSWORD` /
`PG_ADMIN_PASSWORD`) and restarting the Patroni service **regenerates Patroni's
local config** (`/home/postgres/postgres.yml`) to the new values, **but does NOT
`ALTER` the live role passwords.** Config and role drift apart, and nothing
actually rotated. You must also `ALTER ROLE` directly so **role = config**.

Also note **what Patroni manages**: Patroni only reconciles the **superuser**
(`postgres`) and **replication** (`standby`) roles. **`admin` and `authenticator`
are NOT Patroni-managed** → for those, a direct `ALTER` is the only path (there is
no config side to keep in sync).

**6.1 ALTER the Patroni-managed roles via the leader's local socket.** Peer auth
over the local socket needs **no password**, so this works regardless of the
current/new value. Find the leader (`patronictl list`), then:
```bash
# postgres (superuser) and standby (replication), on the LEADER container
sudo docker exec <patroni-leader-container> psql -U postgres \
  -c "ALTER ROLE postgres PASSWORD '<new_super>';"
sudo docker exec <patroni-leader-container> psql -U postgres \
  -c "ALTER ROLE standby PASSWORD '<new_standby>';"
```

**6.2 ALTER the non-Patroni roles directly** (no config side to reconcile):
```bash
sudo docker exec <patroni-leader-container> psql -U postgres \
  -c "ALTER ROLE admin PASSWORD '<new_admin>';"
```
- For **`authenticator`** (see also Rotation A), after the `ALTER` you must also
  update PgBouncer's `DB_PASSWORD` and PostgREST's `PGRST_DB_URI` so the pooled
  consumers re-auth with the new value.

**6.3 Sync the config side** so role = config. Update the ytdb stack env
`PG_SUPERUSER_PASSWORD` / `PG_STANDBY_PASSWORD` / `PG_ADMIN_PASSWORD` (these feed
`PGPASSWORD_*`) and restart the Patroni service to regenerate
`/home/postgres/postgres.yml`. **Restarting the leader triggers a failover**
(leader→replica swap, timeline bumps) — this is **expected and recoverable**, not
an error.

**6.4 Fix stale HAProxy routing after the failover.** Post-failover, **HAProxy
can hold stale routing**: *new* direct TCP connections get
`server closed the connection unexpectedly`, while already-pooled app connections
keep working. Fix with a **rolling restart of the haproxy service**:
```bash
sudo docker service update --force <stack>_haproxy
```

**6.5 Verify.**
- `patronictl list` — the replica shows **`streaming`** with **lag 0**.
- New password works **over TCP** (not just the local socket):
  ```bash
  PGPASSWORD='<new_super>' psql -h haproxy -p 5432 -U postgres -d postgres -c 'select 1;'
  ```
- Apps return **200** (dashboards load; check `/admin/logs`).

**6.6 Stack-env reconcile trick.** After rotating live, update the **Portainer
stack's stored env** to the new values. If the live services already match what
you set, the **stack redeploy is a no-op** (no restart) — this keeps the stored
config truthful without a second disruptive recreate.

**Rollback C:** `ALTER ROLE … PASSWORD '<old>'` over the leader's local socket for
each affected role + revert the stack env to the old values; if replication
detached, re-init the standby per Patroni (`patronictl reinit`).

---

## 7. Rotation D — cloud DB password (low / anytime)

Both cloud projects are **paused** and nothing live uses them. When convenient,
**restore** the project and reset the database password from the Supabase
dashboard (Project → Settings → Database → Reset database password), then
re-pause. Or leave until/if the project is ever un-paused for good. Low risk.

---

## 8. Post-rotation

- Update infra memory / password manager with the new values; delete the old
  ones once everything is confirmed stable for a day.
- Scrub the exposed old values from any notes.
- Consider promoting the ytdb `PG_*` to **Docker secrets** with Spilo `*_FILE`
  env (as `sentinel-stack.prod.yml` does) so future rotations don't pass
  plaintext through stack env at all.
