# HA Notes — Whisper Worker + Summary/Chat (feature/whisper-summary)

Scope of this note: the **Whisper transcription worker** (HA + horizontal
scaling) and the **Ollama-backed summary/chat path** (SPOF + degraded mode +
the path to HA). It documents the deploy config in `docker-compose.prod.yml`
(the `whisper-worker` service) and reports — without changing — how the
read-only app code behaves when the LLM is down.

Everything here is additive / documentation plus the worker's own deploy block.
No app routes, libs, migrations, or other compose services were modified.

---

## 1. Whisper worker — scaling model & how to scale

The worker is a **BullMQ consumer** of the `transcription` queue, `concurrency:
1` per process. It is **safe to run as N replicas** and throughput scales
linearly.

### Why it's concurrency-safe across replicas

| Concern | Verdict | Why |
|---|---|---|
| Two workers grabbing the same job | Safe | BullMQ takes a **Redis-side per-job lock**; each replica atomically pulls a **distinct** job. No app-level coordination needed. |
| Scratch / temp audio | Safe | Each container extracts audio into its **own** `/cache/tmp` (`WHISPER_TEMP_DIR`); the job dir is `mkdtemp`'d per job and always cleaned in a `finally` block. No cross-replica path collision. |
| Model weights cache | Safe, per-node | `HF_HOME=/cache/huggingface` on the `whisper-cache` **named volume**. On Swarm that's a **per-node local volume** — first job on a node downloads the model, later jobs on that node reuse it. Spreading replicas across M nodes = M downloads, not N. |
| DB writes | Safe | Writes are keyed by `video_id` (status transitions + inserts), and a job is only ever held by one worker at a time, so no concurrent write to the same row. Logging is fully fail-safe (errors swallowed, never break the pipeline). |
| Model load | Safe | Loaded once per process at startup (`load_model()` warms it before consuming), reused for every job in that replica. |

**Honest shared-state assessment:** there is essentially **no shared mutable
state** between replicas. The only coordination point is Redis (the queue +
locks), which is exactly what BullMQ is designed for. The single real caveat is
Redis Sentinel **live** failover (section 2), which is a connection-resilience
limitation of the Python BullMQ client, not a multi-replica safety problem.

### How to scale

- **Edit the stack:** raise `deploy.replicas` for `whisper-worker` in
  `docker-compose.prod.yml` and redeploy, **or**
- **Live:** `docker service scale <stack>_whisper-worker=N`.

`replicas: N` == **N concurrent transcriptions**. Default is `1` because the
prod box is shared with Ollama; raise once on dedicated capacity.

- **Resource limits are PER-REPLICA** (`cpus`/`memory` under
  `deploy.resources.limits`). Each replica runs one job at a time, so one job's
  budget = one replica's limit. When scaling to N, ensure the cluster has
  `N ×` that budget free. Bump `WHISPER_CPU_THREADS` to match real core counts
  on dedicated hardware.
- The stack uses `deploy.placement.preferences: spread: node.id` (soft) so
  replicas fan out across nodes — warming each node's model cache and spreading
  CPU load. Soft so a single-node cluster still schedules all replicas.

---

## 2. Redis Sentinel behaviour

- **App side:** transparent. Redis is already Sentinel-aware; the Node/Next.js
  app's Redis client follows master changes. No action needed.
- **Worker side:** **reconnect-on-restart**, not transparent live failover.
  - `worker.py::_redis_connection()` parses `sentinel://…`, asks Sentinel for the
    **current** master at connect time, and hands BullMQ a concrete
    `redis://<master>:<port>` URL.
  - The Python BullMQ client (`bullmq==2.14.0`) **doesn't speak Sentinel** and
    can't follow a master that moves at runtime. So master selection is correct
    **at startup / after any restart** but breaks if Sentinel promotes a new
    master mid-run.
  - **Mitigation (in the deploy config):** `restart_policy: condition:
    on-failure`. A dropped connection crashes the process; Swarm restarts it;
    on boot it re-discovers the new master via Sentinel. This is why
    `on-failure` is mandatory here, not just nice-to-have.
  - **Future improvement:** native Sentinel support in the Python BullMQ client
    (or a thin reconnect-loop wrapper around `Worker` that re-resolves the master
    and recreates the connection on error) would make this transparent. Not done
    here — out of scope (worker code is owned, but this is a deliberately small,
    documented limitation rather than a risky rewrite).

---

## 3. Ollama (LLM for summaries + chat) — SPOF & the HA path

### Current state: single Ollama = SPOF for AI features

Summaries and Q&A chat call a **single** local Ollama instance
(`LLM_BASE_URL=http://hermes-agent_ollama:11434/v1`, provider `local` by
default; Anthropic is an optional per-user/hosted alternative). If that one
Ollama is down, **all** local-provider summary/chat requests fail. This is a
SPOF **for the AI features only** — it does **not** affect transcription (the
worker never calls Ollama).

### Graceful degradation — what actually happens today (verified, read-only)

Confirmed by reading `app-ha/lib/llm.ts`, `app-ha/lib/claude.ts`, and the
summary/chat routes. **An unreachable LLM fails gracefully; it never crashes the
app and never touches transcription.**

- **`lib/llm.ts`** — `localChat()` / `localChatStream()` wrap the `fetch` in
  `try/catch` and throw a **clear, descriptive** `Error`
  (`Local LLM request failed (<url>/chat/completions): <reason>`). Non-2xx and
  non-JSON responses are also turned into explicit errors. There's a 120s
  timeout so a hung Ollama can't wedge the request forever.
- **Summary route** (`app/api/videos/[id]/summary/route.ts`, POST):
  `summariseTranscript → localChat` throws on an unreachable LLM. The route's
  outer `try/catch` returns **HTTP 500 `{ error: <message> }`**. No
  `video_summaries` row is written (the LLM call precedes the insert), so a
  retry once Ollama is back works and is still billed once. The rest of the app
  is unaffected.
- **Chat route** (`app/api/videos/[id]/chat/route.ts`, POST): streaming. The
  fetch happens **inside** the `ReadableStream.start()` after the 200 + headers
  are sent, so a failure is caught in the inner `try/catch`, which enqueues
  `\n\n[Error: failed to generate a response.]` into the stream and closes it
  cleanly. The client sees a friendly inline error, the server logs it, nothing
  crashes.

**Verdict:** degradation is already correct and friendly. The gap is purely
**availability** (one Ollama), not error handling.

### The path to HA — options & recommendation

| Option | How | Pros | Cons (on the shared CPU box) |
|---|---|---|---|
| **A. Multiple Ollama replicas behind a service VIP** | Run Ollama as `replicas: N` on Swarm; the app already targets the service DNS name, which Swarm load-balances (VIP/round-robin) across healthy tasks. | Minimal app change (none needed); removes the SPOF; Swarm health-checks route around a dead replica. | Each replica loads the **full model into RAM** — on a shared CPU box that's the binding constraint; 2× Ollama ≈ 2× model RAM. CPU contention with the Whisper worker. No app-level retry, so an in-flight request to a replica that dies mid-call still fails (caught gracefully, but the user must retry). |
| **B. Small LLM gateway / proxy** (e.g. LiteLLM, or a thin reverse proxy) in front of one-or-more Ollama backends | App points `LLM_BASE_URL` at the gateway; gateway does health-aware routing, retries, and (optionally) failover to a hosted provider. | Adds **retry + failover** the app currently lacks; can fail over to Anthropic when local is down; central place for rate-limiting/observability. | One more moving part to run/HA itself; still bounded by backend RAM/CPU; modest extra latency. |
| **C. Active/passive + Anthropic fallback** | Keep one Ollama; on a `local` failure, fall back to the Anthropic provider that already exists in `lib/llm.ts` / `lib/claude.ts`. | Cheapest in RAM (one Ollama); leans on code paths that already exist. | Requires an **app code change** (a try-local-then-hosted wrapper) — **out of scope for this feature** (read-only app). Adds external cost/dependency when local is down. |

**Recommendation:** On the current shared CPU box, **start with Option A
(2 Ollama replicas behind the Swarm service VIP)** only if there's headroom for
a second model in RAM — it's the lowest-effort real HA win and needs no app
change. If RAM is tight (likely, given the box is shared with the Whisper
worker), **prefer Option B (a small LiteLLM gateway in front of one Ollama
now)**: it immediately adds the retry/failover the app lacks and lets you add a
second backend or an Anthropic fallback later without touching app code (just
repoint the gateway). Option C is the eventual "best UX" (silent fallback to
hosted) but is deferred because it requires editing the read-only app LLM layer.

Either way, transcription HA (sections 1–2) is **independent** of Ollama HA —
the worker never calls the LLM, so a degraded summary/chat path never blocks
transcripts.

---

## 4. HA scorecard — whole feature

| Component | HA status | Notes |
|---|---|---|
| Whisper worker — multi-replica safety | ✅ Ready | Redis-locked job distribution, no shared mutable state, per-node model cache. Scale via `replicas`. |
| Whisper worker — Redis failover | 🟡 Partial (reconnect-on-restart) | Correct master at startup/restart; not transparent live failover (Python BullMQ limitation). `restart_policy: on-failure` mitigates. |
| Redis (app side) | ✅ Sentinel-aware | App client follows master changes transparently. |
| Redis (data store) | ➖ Out of scope here | Sentinel topology is owned elsewhere; this feature only consumes it. |
| Summary/chat graceful degradation | ✅ Verified | Unreachable LLM → caught error, friendly message, app + transcription unaffected. |
| Ollama (summaries/chat availability) | 🔴 SPOF | Single instance. HA path documented (section 3); recommend a LiteLLM gateway, or 2 replicas behind the service VIP if RAM allows. |

Legend: ✅ ready · 🟡 partial/mitigated · 🔴 single point of failure · ➖ out of scope.
