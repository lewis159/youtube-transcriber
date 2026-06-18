# HA Plan — Redis & Local Database (YT Transcriber)

**Date:** 2026-06-18
**Scope:** Make Redis highly available, and move the database OFF cloud Supabase to a **local, self-hosted, HA** Postgres. Local-first; cloud strapped on only via toggles.
**Decisions locked (owner, 2026-06-18):**
- **Build straight to 2-host real HA** — a 2nd host is landing soon, so we do NOT settle for a single-host interim as the deliverable. Target = primary/replica on *separate* hosts with automatic failover.
- **Redis:** add **password auth** + **rename** the Redis-Sentinel components so they don't get confused with the *Sentinel product*.
- Persist this plan to a repo doc **and** Notion.
- Keep **cloud Supabase intact as instant rollback** through the cutover + soak.

**Substrate:** Docker Swarm (YT prod is *already* a single-node Swarm — going multi-host = adding nodes, not re-platforming). Node roles + placement anti-affinity for stateful services. Target now = **2 nodes**; 3rd node later adds etcd/Sentinel quorum.

---

## Part A — Redis HA

### A1. Topology (2 hosts)
- **redis-primary** ×1 — pinned to node A (label `redis=primary`), own per-node volume.
- **redis-standby** ×1 — pinned to node B (anti-affinity from primary), own per-node volume.
- **redis-failover (Sentinel)** ×3 — spread across nodes (`mode: global` or 3 replicas with spread). Quorum 2.
  - *Renamed* from "sentinel" to avoid clashing with the Sentinel product — components/labels prefixed `redis-failover-*` / `project.component=redis-failover`.
- Network: **`yt-prod` overlay** (NOT the bridge net in the current `docker-compose.redis.yml`, which is single-host and must be rewritten).

> **Honest note on "load-balancing for more resource":** Redis is single-master — all queue writes + rate-limit `INCR`s go to one node. master+replica+Sentinel gives **automatic failover** (the real HA you want), not write load-balancing. True write-scaling = Redis Cluster (sharding) — overkill here; revisit only if a single master ever saturates (it won't at this scale; transcription CPU is the real ceiling).

### A2. What's already done vs left
- **Done (code):** app producer (`app-ha/lib/transcription-queue.ts`) and rate-limiter (`app-ha/lib/rate-limit.ts`) already parse `sentinel://` and switch ioredis into Sentinel mode (follows failover transparently). The worker (`whisper-worker/worker.py`) resolves the master at connect time and reconnects-on-restart (`restart_policy: on-failure`) — accepted limitation for the Python BullMQ client.
- **Left (config/infra):** the HA topology stack, env wiring, persistence, placement, **and the password change** (below).

### A3. Auth (NEW — small code change)
Adding `requirepass`/`masterauth`/`sentinel auth-pass` requires the clients to send a password. The current `parseSentinelUrl()` in both libs and `worker.py` does **not** pass a Redis/Sentinel password — so this needs a **small code change** in:
- `app-ha/lib/transcription-queue.ts` and `app-ha/lib/rate-limit.ts` — pass `password` + `sentinelPassword` to ioredis.
- `whisper-worker/worker.py` — pass password to the Sentinel + master connection.
Password stored as a **Docker secret**, referenced by env.

### A4. Persistence
- `appendonly yes`, `appendfsync everysec` (≤1s loss on crash) + keep RDB for fast restart.
- `maxmemory` ≈ 70–75% of the container limit, **`maxmemory-policy noeviction`** (the queue must never have keys evicted — that = silent job loss). Rate-limit keys are tiny + TTL'd, so they don't accumulate; only split them onto a separate logical DB if memory ever becomes a real issue.

### A5. Sentinel-on-Swarm gotcha (the main time sink)
Sentinel resolves `redis-primary` to a Swarm VIP, then must reach the *actual* container IPs — needs `announce-ip`/`announce-port` per instance, and each Sentinel needs its **own writable config** (Sentinel rewrites its config at runtime; 3 containers sharing one bind-mounted file corrupts each other). Budget iteration here.

### A6. Changes (described — not yet written)
- Rewrite `docker-compose.redis.yml` as a Swarm overlay stack: `redis-primary`, `redis-standby` (`--replicaof`), `redis-failover` ×3, AOF + `noeviction`, `requirepass`/`masterauth`, per-node volumes, placement constraints/anti-affinity, renamed components.
- `REDIS_URL=sentinel://redis-failover:26379/0?sentinelName=mymaster` (+ password) for `app` and `whisper-worker` in `docker-compose.prod.yml`.
- Small auth code change in the two libs + worker.
- Replace `redis-data` → `redis-primary-data` + `redis-standby-data`.

### A7. Phases & verification
1. **Build to 2 hosts (real failover):** stand up the topology with primary on node A, standby on node B, 3 Sentinels spread; resolve announce-IP. **Verify:** power off node A → Sentinel quorum promotes standby; app keeps serving (ioredis follows); worker auto-restarts onto new master; enqueue/consume resumes with no manual action.
2. **3rd host later:** ensure 3 Sentinels on 3 distinct nodes (true quorum); optional 2nd replica.
- Effort: ~2 days infra/config + ~0.5 day for the auth code change.

---

## Part B — Local HA Database

### B1. The finding that makes this safe
The app uses Supabase as **only a Postgres DB via PostgREST** (`@supabase/supabase-js`, service-role key). **No Supabase Auth** (Clerk), **no Storage**, **no Realtime** (only a transitive dep, never imported). → We self-host with **zero app code changes** — repoint `NEXT_PUBLIC_SUPABASE_URL` and re-mint the JWT keys.

### B2. Stack (recommended — Option A)
Reuse Sentinel's failover-proven design + add PostgREST:
```
app-ha (supabase-js, service_role JWT)
  → PostgREST  (PGRST_DB_URI → haproxy:5432, PGRST_DB_SCHEMAS=public,ops)
    → HAProxy :5432 → current Patroni leader (writes) · :5433 → replicas (reads, later)
      → Patroni-a / Patroni-b (Spilo 16) + etcd (leader election) — anti-affinity across hosts
  + PgBouncer (transaction pooling) · + pgBackRest (PITR → OVH object storage)
```
Rejected: official full self-hosted Supabase (bundles Auth/Storage/Realtime/Kong we don't use, and its Postgres isn't HA). Deferred (optional Phase 5): refactor `supabase-js` → direct `pg`/Drizzle driver and retire PostgREST.

### B3. Keys / JWT
Supabase `anon`/`service_role` keys are HS256 JWTs signed with a shared `JWT_SECRET`. To keep supabase-js working:
1. Generate `JWT_SECRET` (Docker secret).
2. Mint `anon` (`role=anon`) and `service_role` (`role=service_role`) JWTs signed with it → become the app's `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
3. Bootstrap Postgres roles: `authenticator` (login, NOINHERIT), `anon`, `authenticated`, `service_role` (with `BYPASSRLS` — matches today's service-role-bypasses-RLS behaviour). Migration `009` GRANTs to `service_role`, so roles must exist before migrations load.
4. PostgREST env: `PGRST_JWT_SECRET`, `PGRST_DB_URI=postgres://authenticator@haproxy:5432/postgres`, `PGRST_DB_SCHEMAS=public,ops`, `PGRST_DB_ANON_ROLE=anon`.
- App env diff is the **entire app-side change**: 3 vars (URL + 2 keys). New URL must NOT contain "placeholder" (guard paths in `admin-auth.ts`/`audit.ts` key off that).

### B4. Schema + data migration + cutover
1. Build schema: bootstrap roles → load `supabase/schema.sql` → migrations `001`→`012` in order (skip `_down` files; they're idempotent).
2. `pg_dump --data-only --schema=public --schema=ops` from cloud `ygfxzkpkwyqqvibljxpw` → restore local. Handle `tier_features` seed collision (truncate-before-restore or exclude).
3. Verify: per-table row counts local vs cloud, FK integrity, jsonb (`transcripts.content`) round-trip, supabase-js smoke through PostgREST with both keys.
4. **Cutover:** brief write-freeze → final sync → flip the 3 env vars → redeploy (start-first) → full smoke (sign in, transcribe, notes, admin audit, changelog/roadmap).
5. **Rollback = flip 3 env vars back to cloud.** Keep cloud running, untouched, for a ~2-week soak before decommissioning.

### B5. Backups (HARD, day-one requirement)
Leaving Supabase = losing its managed backups. Ship from the first instance:
- **pgBackRest/WAL-G** (Spilo has built-in support) → **OVH Object Storage (S3)**, offsite.
- Continuous WAL archiving + base backups; retention e.g. 7 daily / 4 weekly; **PITR** (protects against bad migration / logical corruption, which replication does NOT).
- Encrypt at rest; creds + key as Docker secrets.
- **Scheduled restore-test** (restore latest → row-count check) — untested backups aren't backups.

### B6. Multi-host HA & scaling
- **2 hosts (target now):** Patroni-a on node A, Patroni-b on node B (anti-affinity via `pgnode` label, node-local pgdata volumes — never a shared driver). HAProxy `option httpchk GET /primary` on Patroni REST :8008 → writes always hit the live leader; one host dies → Patroni auto-promotes, HAProxy reroutes, **no manual action**. PostgREST + HAProxy run 2× (spread).
  - etcd caveat: at 2 nodes etcd is a single member (a DCS blip pauses *failover decisions*, not a running leader). True DCS fault tolerance needs the **3rd node** (3-member etcd) — planned reconfigure, not a hot scale.
- **Pooling/reads:** PgBouncer (transaction mode) between PostgREST and HAProxy; read replicas reachable on HAProxy :5433 for later read-offload (optional, needs a 2nd PostgREST or the direct-driver refactor).
- **Sync vs async replication:** async (default) risks a few last txns on failover; sync = zero loss at latency cost. **Open decision.**

### B7. Phases & verification
| Phase | Work | Effort | Exit check |
|---|---|---|---|
| 0. Prep | JWT_SECRET + mint keys + role-bootstrap SQL + PostgREST hostname | 0.5d | keys verify; SQL reviewed |
| 1. Build (2 hosts) | etcd + Patroni a/b (anti-affinity) + HAProxy + PostgREST + PgBouncer + **pgBackRest day one**; load schema+migrations | 2–3d | supabase-js smoke green; first backup + test restore OK |
| 2. Migrate + cutover | pg_dump cloud → restore → verify → flip 3 env vars → smoke; cloud kept as rollback | 1d + window | counts match; full app smoke green on local DB; rollback rehearsed |
| 3. Failover drill | kill the leader node | 0.5d | survivor auto-promotes, HAProxy reroutes, app keeps serving, no manual action |
| 4. 3rd host | etcd 1→3 members (quorum); spread services | 1–2d | kill any node → no DCS blackout; failover still automatic |
| 5. (Optional, later) | refactor supabase-js → direct driver, retire PostgREST | 3–5d | full regression; read/write split |

---

## Combined build sequence
1. **Redis HA stack** (2 hosts) + auth code change — independent, lower risk, do first.
2. **DB Phase 0–1** (build local Patroni+PostgREST+pgBackRest on the 2 hosts).
3. **DB Phase 2** (migrate + cutover; cloud as rollback).
4. **Failover drills** for both Redis and DB.
5. 3rd-host quorum when it lands.
All build work runs via sub-agents; nothing merged without review.

## Open decisions still needed
1. **Sync vs async** Postgres replication (zero-loss-on-failover vs latency).
2. **OVH Object Storage** bucket + credentials for backups — who provisions?
3. **Replica count** at 3 hosts (1 vs 2) for both Redis and Postgres.
4. **JWT secret / password rotation** runbook ownership.
5. PostgREST version pinned compatible with the installed `supabase-js`/`postgrest-js` (verify the embedded-join in `audit.ts`).

## Risks
- **Single-host interim is a downgrade** vs cloud — mitigated by building straight to 2 hosts (owner's decision).
- **Sentinel-on-Swarm announce-IP** + **Patroni anti-affinity/etcd quorum** are the trickiest bits — budget iteration, verify with real failover drills, don't assume.
- **Backups are now self-owned** — the single biggest new responsibility; must ship day one.

*Plan only — no infrastructure or code changed. Mirrors the Notion page of the same name.*
