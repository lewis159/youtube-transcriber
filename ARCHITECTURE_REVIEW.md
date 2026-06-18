# Estate Architecture Review — HA & Scalability Gap Analysis

**Date:** 2026-06-17
**Scope:** Whole estate — YT Transcriber, Sentinel, Hermes, and shared infrastructure.
**Type:** Gap analysis (current state → SPOFs → HA/scalable target → prioritised path).
**Method:** Read-only audit of the repos + owner-described live topology. Nothing was changed.
**Status of facts:** Live topology is owner-described; items marked **[VERIFY]** could not be confirmed from files and should be checked on the box.

---

## 1. Executive summary

The estate is **three production products (YT Transcriber, Sentinel, Hermes) plus all their dependencies running on a single OVH box as a single-node Docker Swarm**, fronted by one Nginx Proxy Manager (NPM), with **no backups and no monitoring**. The application code is well-built and largely HA-*ready* (stateless app tier, Sentinel-aware Redis client, horizontally-scalable BullMQ worker, a proven Patroni HA-Postgres design for Sentinel) — but **none of that HA is actually realised**, because every HA design needs ≥2 nodes and there is one.

The single most important truth: **on one box, "HA" is theatre.** Replica counts, anti-affinity, and Sentinel/Patroni designs add resilience only once a second node exists. So the work splits cleanly into:

- **Phase 0 — things worth doing on one box right now** (backups, monitoring, image-SHA pinning, durability/idempotency fixes, LLM fallback). High value, low/again no dependency on more hardware.
- **Phase 1 — add a 2nd node** (workload failover becomes real).
- **Phase 2 — go to 3 managers** (control-plane HA / quorum), dedicated LB tier, real Redis/Patroni HA.

### The five CRITICAL findings (all auditors independently flagged these)

1. **[CRITICAL] One physical box = total estate SPOF.** Hardware/kernel/disk/OVH incident takes down all three products at once, and a single-manager Swarm has **no Raft quorum** — control-plane state corruption is unrecoverable without surgery. Nothing self-heals with zero surviving nodes.
2. **[CRITICAL] No backups, anywhere.** No `pg_dump`/WAL/snapshot tooling exists in any repo. Node-local volumes (`redis-data`, `whisper-cache`, Sentinel `patroni-*-data`/`etcd-data`, Hermes) die with the box. Patroni gives *failover*, not backup — a `DROP TABLE` replicates faithfully.
3. **[CRITICAL] Supabase is an unbacked third-party SPOF for the revenue-critical YT data** (`users`, `credit_transactions`, `transcripts`). You hold no independent copy; a project pause, destructive SQL, or account issue loses it with no recovery path you control. **[VERIFY]** Supabase PITR is plan-gated — confirm it's on.
4. **[CRITICAL] NPM is a single ingress terminating TLS for every domain.** If NPM dies, *all* apps go dark regardless of app-replica counts. Its config + certs live only on the box, **not in version control**.
5. **[CRITICAL] Single Redis on the queue critical path** (no Sentinel, RDB-only `--save 60 1`, no AOF). A crash loses up to 60s of in-flight/queued jobs and strands `videos.status` mid-transcription.

---

## 2. Current state (the reality)

- **1 OVH dedicated server** (51.83.7.159), **single-node Docker Swarm** (the one node is both the only manager and only worker), Portainer-managed.
- **NPM** terminates TLS / routes ingress for `yt.bentech.dev`, `hermes.bentech.dev`, and Sentinel (`ops.bentech.dev` in repo — **[VERIFY]** live domain). Cloudflare appears to be in front for DNS. **The prod ingress config is entirely out-of-repo.**
- **YT Transcriber** (`docker-compose.prod.yml`): `app` ×2 (stateless, Clerk auth, no published ports — reached via the external `proxy` overlay), `redis` ×1, `whisper-worker` ×1, `docker-socket-proxy` ×1 (manager-pinned). DB = **cloud Supabase**. Images `ghcr.io/lewis159/...:latest` built by GitHub Actions on push to `master`; deployed by Portainer git-stack.
- **Sentinel**: live, but the repo's `sentinel-stack.prod.yml` is a **multi-node HA design (Patroni + etcd + HAProxy, anti-affinity by node label) that cannot schedule on one node** — so what's live is **[VERIFY]** likely the single-Postgres `*.local` variant, not the HA stack.
- **Hermes** (Open WebUI + Ollama, `qwen2.5`): **no compose in either repo** — managed out-of-band. YT reaches it cross-stack at `hermes-agent_ollama:11434` over the external `hermes-agent_hermes-net` overlay.
- **No automated backups. No monitoring/alerting.** Secrets are **plaintext Swarm stack env vars** (Portainer); no Docker secrets / vault.
- **Doc/reality drift:** `CLUSTER_ARCHITECTURE.md` + `docker-compose.yml`/`-ha.yml` describe a *different, dev-only* bridge-network nginx-ha pair (HTTP, ports 4000/4001). These are **not** prod and will mislead an operator.

---

## 3. Findings by layer

### 3.1 Compute & orchestration
- **[CRITICAL]** Single box; **[CRITICAL]** single-manager = no quorum; **[HIGH]** Sentinel HA stack unschedulable on 1 node; **[HIGH]** CPU/RAM contention (3 apps + Whisper + Ollama); **[MEDIUM]** cross-stack `hermes-net` coupling (a Hermes redeploy can fail YT scheduling); **[MEDIUM]** `:latest` everywhere.
- **Target:** Phase 1 add a 2nd node as `role=workload` worker (apply `role`/`pgnode` labels now). Phase 2 go **1→3 managers** (never stop at 2 — quorum-of-2 is *worse* than 1). Dedicate a 3rd `role=mgmt` node for Portainer + Sentinel + the 3rd etcd member.

### 3.2 Ingress, TLS & load balancing
- **[CRITICAL]** NPM single front door; **[CRITICAL]** single-node ingress; **[HIGH]** TLS certs unversioned/opaque on the box; **[HIGH]** NPM config not in IaC; **[MEDIUM]** no Cloudflare real-IP restoration (breaks rate-limiting/abuse logging/Clerk redirects behind CF).
- **Target (owner wants dedicated LB VMs):** 2× LB VMs running HAProxy/nginx with a **keepalived floating VIP** (active/passive), OR **Cloudflare LB / Tunnel** at the edge (lowest effort, CF already in front; Origin Cert kills renewal churn), OR **Traefik in Swarm `global` mode** (retires the un-versioned NPM, unifies config). Recommended composite: CF LB/Tunnel → LB pair or Traefik-global → app replicas over `proxy`. All routing/TLS config in IaC. Keep Sentinel behind Cloudflare Access/Zero-Trust.

### 3.3 Data, storage & backups
- **[CRITICAL]** no backups; **[CRITICAL]** Supabase unbacked dependency; **[HIGH]** node-local volumes don't follow rescheduled tasks (no shared/replicated storage); **[HIGH]** Redis RDB-only; **[MEDIUM]** single etcd member; **[MEDIUM]** forward-only migrations + no pre-migrate dump = no safe rollback; **[LOW]** two competing Sentinel DB designs (Patroni vs stale repmgr/PgPool).
- **Target:** offsite logical dumps (Supabase **and** Sentinel PG) to OVH Object Storage/S3 + WAL-G/pgBackRest PITR on Spilo; Redis AOF; volume snapshots for Hermes. **Self-hosting YT's DB on Patroni** (the dropped idea) is viable but carries real burden (you'd own PITR, RLS parity, and Supabase Auth/Storage/Realtime replacements) — **recommend keeping YT on Supabase short-term with independent offsite dumps, and only migrating once the 2-node Patroni cluster + backup pipeline is proven for Sentinel.**

### 3.4 Queue, cache, workers & LLM
- **[CRITICAL]** single Redis; **[HIGH]** RDB-only/no eviction policy (backlog can OOM the box); **[HIGH]** single Ollama + CPU contention with Whisper (summaries hit the 120s timeout and hard-fail with no fallback); **[MEDIUM]** BullMQ stall/lock defaults un-tuned (long transcriptions risk stall re-delivery → duplicate work); **[MEDIUM]** worker writes not idempotent (`save_transcript`/`create_job_row` insert, not upsert → duplicate rows on retry); **[LOW]** `removeOnFail:false` grows unbounded.
- **Target:** Redis Sentinel + AOF + `maxmemory` policy (isolate rate-limit keys); set BullMQ `jobId=videoId` + upserts keyed on `video_id` for full idempotency; tune `lockDuration`/`stalledInterval` to exceed worst-case transcription time; **LLM fallback to the hosted Anthropic path on local timeout/5xx** (code path already exists — cheap immediate win); long-term a LiteLLM gateway in front of ≥2 Ollama replicas, ideally GPU and off the Whisper box.

### 3.5 App, deploy, observability & security
- **Good:** app tier genuinely stateless (Clerk JWT — no sticky sessions needed); prod Dockerfile multi-stage + non-root; start-first rolling updates; socket-proxy locked to `CONTAINERS+POST` only.
- **[HIGH]** `:latest` + no SHA pin = no deterministic deploy/rollback; **[HIGH]** no monitoring/alerting; **[HIGH]** deep `/api/health` (DB-coupled) used for liveness in the *stale* HA compose → a Supabase blip would restart all replicas (prod correctly uses shallow `/api/ping` — fix the stale files before they're ever used); **[MEDIUM]** secrets as plaintext stack env (visible in Portainer/`docker inspect`, no rotation); **[MEDIUM]** service-role key used for ~all data access — **RLS is not the enforcement boundary**, tenant isolation depends on hand-written `user_id` filters (some helpers take a bare video id); **[MEDIUM]** socket-proxy `POST=1` lets the app stop/kill *any* container on the host.
- **The autoscale/drain/zero-downtime controller does NOT exist** — the 70%/40%/min-2/max-10 + session-drain design lives only in markdown; "drain" is a manual admin stop button. Scaling today is manual (`docker service scale`). **Either build it or amend the docs to say "manual scaling."**
- **Target:** SHA-pinned deploys + `docker service rollback`; Prometheus + cAdvisor + Grafana + Loki (the `event-log.ts` logger already has a Loki sink extension point) + Uptime-Kuma + Alertmanager (natural fit for the Sentinel console to consume); Docker secrets/vault + key rotation; tighten ownership checks; decide on the autoscaler.

---

## 4. Phased target & prioritised roadmap

### Phase 0 — do now, on the current single box (no new hardware)
| # | Action | Layer | Effort | Why |
|---|---|---|---|---|
| 0.1 | **Offsite logical backups** (Supabase + Sentinel PG `pg_dump` → S3/OVH Object Storage) + **verify Supabase PITR** | Data | S | Closes the biggest CRITICAL with no hardware |
| 0.2 | **Basic monitoring + external uptime + alerting** (Uptime-Kuma → email/Slack) | Obs | S | Stop finding outages from users |
| 0.3 | **Pin prod images to SHA** (keep `:latest` as convenience) + document rollback | Deploy | S | Deterministic deploy + `docker service rollback` |
| 0.4 | **Redis AOF + maxmemory/eviction policy**; isolate rate-limit keyspace | Queue | S | Durability + stop a backlog OOMing the box |
| 0.5 | **Idempotent worker writes** (`jobId=videoId`, upsert on `video_id`) + tune BullMQ lock/stall | Worker | S–M | Prevent duplicate transcripts on retry/stall |
| 0.6 | **LLM fallback to hosted on local timeout/5xx** | LLM | S | Removes hard summary failures under CPU load |
| 0.7 | **Move secrets to Docker secrets**; rotate service-role + Stripe keys | Security | M | Remove plaintext-in-Portainer exposure |
| 0.8 | **Capture prod ingress (NPM) config + Cloudflare real-IP into IaC**; mark stale HA docs/Dockerfile as dev-only | Ingress/Docs | S | Reproducibility; stop mis-deploys |

### Phase 1 — add a 2nd node (workload HA)
| # | Action | Effort |
|---|---|---|
| 1.1 | Provision 2nd OVH node; join as `role=workload` worker; apply `role`/`pgnode` labels | M |
| 1.2 | Verify `hermes-net` attachable from both nodes; pin stateful volumes by node constraint | M |
| 1.3 | Separate Whisper/Ollama onto sized capacity; front Ollama with a LiteLLM gateway | M–L |
| 1.4 | Edge HA: Cloudflare LB/Tunnel now (no new VM needed) to remove the NPM single-front-door | M |

### Phase 2 — 3 managers (control-plane HA) + real stateful HA
| # | Action | Effort |
|---|---|---|
| 2.1 | Go **1→3 managers** (add `role=mgmt` node; quorum 2/3); move Portainer + Sentinel + 3rd etcd there | M |
| 2.2 | Deploy Sentinel Patroni HA stack for real (2 members anti-affinity) + WAL-G PITR | M–L |
| 2.3 | Migrate YT Redis to Sentinel topology (code already supports it) across ≥2 nodes | M |
| 2.4 | Dedicated LB VM pair + keepalived VIP (owner's stated target) fronting `proxy` | M–L |
| 2.5 | Full obs stack (Prometheus/Grafana/Loki/Alertmanager) consumed by the Sentinel console | L |
| 2.6 | (Decision) self-host YT DB on Patroni — only after the above is proven | L |

---

## 5. Live checks to verify ([VERIFY] items)
- `docker node ls` — confirm single node / manager status.
- `docker stack services` / `docker service ls` — which **Sentinel** stack is live (Patroni vs single Postgres)? Any tasks `Pending`?
- **Hermes** — where is its compose/stack defined? Is `hermes-agent_hermes-net` `overlay attachable=true`?
- **Supabase** — PITR enabled on `ygfxzkpkwyqqvibljxpw`? Retention? Project not paused?
- **Redis** — `CONFIG GET save appendonly maxmemory maxmemory-policy`; BullMQ `wait/active/failed` set sizes.
- **NPM** — single instance? bound to :80/:443? attached to `proxy`? cert expiry + renewal cron?
- **Secrets** — confirm plaintext stack env vs any Docker secrets; any `.env` on host.
- **Duplicate rows** — query Supabase for >1 `transcripts`/`transcription_jobs` per `video_id` (confirms the idempotency gap is live).
- Host CPU/RAM + current utilisation — to size the Whisper/Ollama split.

---

## 6. Open decisions (need a conversation, not an assumption)
1. **Self-host YT's DB?** Confirmed it was a real intent; reason for dropping isn't on record. Recommend: defer until Phase 2, keep Supabase + offsite dumps now.
2. **LB approach:** dedicated LB VMs + keepalived VIP vs Cloudflare LB/Tunnel vs Traefik-global. (Owner leans dedicated LB VMs.)
3. **VM/infra naming convention** — proposed separately; depends on LB decision + region codes.
4. **Autoscaler:** build the documented controller, or formally downgrade the docs to "manual scaling"?
5. **How many nodes / what budget** for Phase 1 & 2 hardware.

---

*Generated from a 5-dimension parallel read-only audit. No infrastructure or code was modified. Recommendations are for discussion before any change.*
