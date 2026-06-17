# Production Deploy Runbook — Whisper + Summary feature

Target: **yt.bentech.dev** — Portainer on an OVH Docker **Swarm**.
Stack file: `docker-compose.prod.yml`. Redeploy is **manual** via Portainer.

This feature adds two capabilities to the live stack:

1. **AI summaries + Q&A chat** powered by the user's **local Hermes Ollama**
   (model `qwen2.5`), reached over the existing external Swarm network
   `hermes-agent_hermes-net` at service `hermes-agent_ollama:11434`.
2. A **Whisper transcription worker** (`ghcr.io/lewis159/youtube-transcriber-worker`)
   that pulls audio jobs off the prod redis queue and writes transcripts to
   Supabase.

---

## 0. Prerequisites (verify before you start)

- [x] **Migrations 010 / 011 / 012 already applied** to the prod Supabase DB.
- [x] **Feature flags set** for summaries/chat/whisper.
- [ ] **External Hermes network reachable.** The prod stack must be able to join
      `hermes-agent_hermes-net`.
      - **Critical caveat (cross-stack network on Swarm):** a service in this
        stack can only attach to another stack's overlay network if that network
        is an **overlay** network created with **`attachable: true`** (or the
        joining services are scheduled where the network is available). If the
        Hermes stack did **not** create `hermes-net` as attachable, this stack's
        `app` and `whisper-worker` services will **fail to start** with a
        "network not found / not manually attachable" error.
      - **Verify on a manager node:**
        ```bash
        docker network inspect hermes-agent_hermes-net \
          --format '{{.Driver}} attachable={{.Attachable}} scope={{.Scope}}'
        # want: overlay attachable=true scope=swarm
        ```
      - **Fallback if it is NOT attachable / does not exist:** instead of joining
        the Hermes network, run a **dedicated Ollama service inside this prod
        stack** (add an `ollama` service on `yt-prod`, pull `qwen2.5`), and set
        `LLM_BASE_URL=http://ollama:11434/v1`. This removes the cross-stack
        dependency entirely at the cost of a second Ollama instance + model RAM.
- [ ] **Required stack env / secrets present** in Portainer (same mechanism the
      app already uses): `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
      all existing CLERK / STRIPE / `NEXT_PUBLIC_*` vars. The worker reuses
      `NEXT_PUBLIC_SUPABASE_URL` (as `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Optional worker tuning env (defaults shown): `WHISPER_MODEL=base`,
      `WHISPER_CPU_THREADS=2`, `MAX_AUDIO_SECONDS=7200`, `WHISPER_CPU_LIMIT=2.0`,
      `WHISPER_MEM_LIMIT=4G`.
- [ ] **Redis topology — `REDIS_URL`.** The queue connection is topology-flexible
      (same code path in the app producer and the worker):
      - **Prod (HA)** runs **Redis Sentinel**, so both `app` and `whisper-worker`
        use the **Sentinel URL**:
        `REDIS_URL=sentinel://sentinel-1:26379,sentinel-2:26380,sentinel-3:26381/0?sentinelName=mymaster`
        The connection auto-discovers the current master, so the queue survives a
        Redis failover. **App side** (ioredis) follows the new master transparently.
        **Worker side** (Python BullMQ) discovers the master at connect time only;
        on a live failover it reconnects/restarts (`restart_policy: on-failure`)
        to re-discover the promoted master — not seamless, but self-healing. See
        `whisper-worker/worker.py::_redis_connection()`.
      - **Local dev** uses the single-redis stack: `REDIS_URL=redis://redis:6379`
        (or leave `REDIS_URL` unset and rely on `REDIS_HOST`/`REDIS_PORT`).
        Behaviour on this path is unchanged.

---

## 1. Confirm CI built both images

Two workflows push to GHCR on push to `master`:

- `build-push.yml` → `ghcr.io/lewis159/youtube-transcriber:latest` (+ `:<sha>`) — the app.
- `build-push-worker.yml` → `ghcr.io/lewis159/youtube-transcriber-worker:latest` (+ `:<sha>`) — the worker.

Check both `:latest` tags exist (and note their `:<sha>` for rollback):

```bash
docker manifest inspect ghcr.io/lewis159/youtube-transcriber:latest        > /dev/null && echo "app OK"
docker manifest inspect ghcr.io/lewis159/youtube-transcriber-worker:latest > /dev/null && echo "worker OK"
```

If a workflow didn't trigger (e.g. only compose changed, not `whisper-worker/**`),
run it manually from GitHub → Actions → "Build & Push Whisper Worker" →
**Run workflow**.

---

## 2. Update the stack in Portainer

1. Portainer → **Stacks** → the YT prod stack → **Editor**.
2. Paste the new `docker-compose.prod.yml`.
3. Under **Environment variables**, confirm everything resolves — especially:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - (optional) the `WHISPER_*` tuning vars.
4. Ensure the external network `hermes-net` (real name `hermes-agent_hermes-net`)
   resolves — it must already exist and be attachable (Step 0). If not, apply the
   dedicated-Ollama fallback before deploying.

New/changed bits in the compose file:
- `app.environment` gains `LLM_PROVIDER=local`,
  `LLM_BASE_URL=http://hermes-agent_ollama:11434/v1`, `LLM_MODEL=qwen2.5`.
- `app` joins the `hermes-net` network (in addition to `yt-prod`, `proxy`).
- New `whisper-worker` service (replicas 1) on `yt-prod` + `hermes-net`,
  with a `whisper-cache` named volume.
- Top-level `networks.hermes-net` declared `external` →
  `name: hermes-agent_hermes-net`.

---

## 3. Re-pull images + redeploy, then verify

1. In the Portainer stack editor, enable **Re-pull image and redeploy** (or tick
   "Pull latest image versions") and **Update the stack**. This forces fresh
   `:latest` pulls for both app and worker.
2. **Verify the worker connects to redis** — check the worker service logs in
   Portainer; expect a clean BullMQ/redis connection (no `ECONNREFUSED`) and a
   "waiting for jobs" style line. Or from a manager node:
   ```bash
   docker service logs --tail 50 <stack>_whisper-worker
   ```
3. **Verify the app can reach Ollama.** Exec into a running `app` task and curl
   the Hermes endpoint over the external network:
   ```bash
   # find an app container id on a node, then:
   docker exec -it <app_container> sh -c \
     "wget -qO- http://hermes-agent_ollama:11434/v1/models || echo 'OLLAMA UNREACHABLE'"
   ```
   A JSON list of models (including `qwen2.5`) = success. "UNREACHABLE" means the
   cross-stack network isn't joined — revisit Step 0.

---

## 4. Smoke test (end to end)

1. Sign in to https://yt.bentech.dev.
2. Add a **captioned** video → confirm a transcript is produced.
   (For the *Whisper* path specifically, add a video **without** captions, or one
   that routes to the worker — confirm the `whisper-worker` logs show it picking
   up the job and writing a transcript.)
3. Open the transcript → **Summary** → **Generate**.
   - Expect this to be **slow on CPU** (qwen2.5 on a shared Ollama box). Allow up
     to the app's local timeout (~120s). A summary appearing = LLM path works.
4. Try the **Q&A chat** on the same transcript (streaming response).
5. Check **`/admin/logs`** for errors around summary/chat/transcription.

---

## 5. Teardown / rollback

The fastest rollback is to **re-deploy the previous `docker-compose.prod.yml`**
(the version without the LLM env, the `whisper-worker` service, and the
`hermes-net` network). Because `:latest` now points at the new app image, pin to
the **previous image by sha** for a true rollback:

1. In the stack editor, change the app image to the prior known-good sha:
   `ghcr.io/lewis159/youtube-transcriber:<previous-sha>`
   (and remove the worker service / LLM env / hermes-net network).
2. Re-deploy with re-pull.

Notes:
- Record the current `:latest` **sha** for both images *before* each deploy so
  you always have a rollback target (`:latest` is mutable; shas are not).
- Removing the `whisper-worker` service does **not** delete the `whisper-cache`
  volume — model weights persist for next time. Delete the volume manually only
  if you want to reclaim disk.
- Rolling back the app stack does **not** touch the DB. Migrations 010/011/012
  are forward-compatible with the prior app version (additive), so no DB rollback
  is required for a stack revert.

---

## Risks / things to watch

- **Cross-stack external network is the #1 risk.** If `hermes-agent_hermes-net`
  isn't an attachable overlay, both `app` and `whisper-worker` will fail to
  schedule. Verify in Step 0; use the dedicated-Ollama fallback if needed.
- **CPU summaries are slow.** qwen2.5 on a shared CPU box can approach the app's
  120s local timeout for long transcripts. Tune transcript size / max tokens if
  users hit timeouts.
- **Resource contention.** Whisper and Ollama share the box. The worker is capped
  (`WHISPER_CPU_LIMIT`/`WHISPER_MEM_LIMIT`, default 2 CPU / 4G, 2 threads). Raise
  only on dedicated hardware.
- **Single worker replica.** `replicas: 1` — no transcription throughput beyond
  one concurrent job. Scale up later if the queue backs up.
