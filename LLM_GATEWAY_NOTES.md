# LLM HA Gateway (LiteLLM) — YT Transcriber

A LiteLLM proxy sits between the app and the local Ollama, so an Ollama
timeout/error no longer hard-fails AI summaries and Q&A chat. The proxy presents
one OpenAI-compatible endpoint, load-balances across Ollama replicas (1 today,
N later — HA-ready), and **falls back to hosted Claude (Anthropic)** on local
failure/timeout.

## Topology

```
                         ┌──────────────────────────────┐
  app (Next.js)          │           LiteLLM            │
  LLM_PROVIDER=local     │     (service `litellm`)      │
  LLM_BASE_URL ─────────▶│      OpenAI API :4000        │
  = http://litellm:4000/v1│                              │
  LLM_MODEL=yt-llm       │  yt-llm ─┬─▶ ollama/qwen2.5  │──▶ Ollama (local, primary)
                         │          └─▶ claude-fallback │──▶ Anthropic Claude (fallback)
                         └──────────────────────────────┘
```

- The app still believes it is calling a **local OpenAI-compatible endpoint**
  (`LLM_PROVIDER=local`). That endpoint is now LiteLLM, not Ollama directly.
- LiteLLM tries the local model first. On failure/timeout (after a retry) it
  routes the same request to **hosted Claude** (`claude-haiku-4-5`).
- This is independent of the app's existing **per-user hosted toggle** in
  `app-ha/lib/claude.ts` — that path constructs the Anthropic SDK directly and is
  left fully intact. The LiteLLM fallback is an additional safety net for the
  default local path, not a replacement for the user toggle.

## Served model name

**`yt-llm`** — this is what the app sends as `LLM_MODEL`. It maps to
`ollama/qwen2.5` with a Claude fallback.

The bare name **`qwen2.5`** is also still served (same primary + fallback), so
any caller that hasn't been repointed keeps working.

## Required environment

Set these on the stack (Portainer stack env / `.env`):

| Var | Used by | Notes |
|-----|---------|-------|
| `ANTHROPIC_API_KEY` | `litellm` (fallback) **and** `app` (per-user hosted toggle) | Hosted Claude key. |
| `OLLAMA_BASE_URL` | `litellm` | Ollama base URL, **no `/v1` suffix** (LiteLLM's `ollama/` provider appends the path). Defaults to `http://hermes-agent_ollama:11434`. |

The app's `LLM_BASE_URL` (`http://litellm:4000/v1`) and `LLM_MODEL` (`yt-llm`)
are hard-set in `docker-compose.prod.yml`, not env-driven.

## ⚠️ Network requirement — DEPLOY DECISION (not yet resolved)

**LiteLLM must be able to reach the Ollama service.** The default
`OLLAMA_BASE_URL` points at the Hermes stack's Ollama (`hermes-agent_ollama`),
which lives on the **`hermes-agent_hermes-net`** overlay network. A prior PR
**removed `hermes-net` from this stack** (see the `networks:` section of
`docker-compose.prod.yml`), so as written `litellm` is only on `yt-prod` and
**cannot reach `hermes-agent_ollama`**.

This was deliberately **flagged, not silently fixed** — `hermes-net` may or may
not be attachable, and re-adding it changes this stack's network surface. Pick
ONE before deploying:

**Option A — join the Hermes overlay (reuse the existing Ollama):**
1. Ensure the network is attachable:
   `docker network create -d overlay --attachable hermes-agent_hermes-net`
   (or confirm the Hermes stack created it `--attachable`).
2. In `docker-compose.prod.yml`, add to the `litellm` service:
   ```yaml
       networks:
         - yt-prod
         - hermes-net
   ```
3. Add to the top-level `networks:` block:
   ```yaml
     hermes-net:
       external: true
       name: hermes-agent_hermes-net
   ```
4. Keep `OLLAMA_BASE_URL=http://hermes-agent_ollama:11434`.

**Option B — dedicated Ollama in this stack:**
1. Add an `ollama` service on `yt-prod` (with a model volume + the qwen2.5 model
   pulled).
2. Set `OLLAMA_BASE_URL=http://ollama:11434`.
3. No external network needed.

Option A reuses GPU/model state already on the Hermes box; Option B isolates
this stack but duplicates the model. Default config assumes Option A's hostname
but does **not** wire the network — that is the explicit decision left to deploy.

## Adding more Ollama replicas later (HA / horizontal scale)

LiteLLM load-balances across deployments **sharing the same `model_name`**. To
add a second Ollama backend, add another `yt-llm` entry in
`deploy/litellm-config.yaml` pointing at the new instance:

```yaml
model_list:
  - model_name: yt-llm
    litellm_params:
      model: ollama/qwen2.5
      api_base: os.environ/OLLAMA_BASE_URL          # replica 1
      timeout: 120
  - model_name: yt-llm
    litellm_params:
      model: ollama/qwen2.5
      api_base: http://ollama-2:11434               # replica 2
      timeout: 120
  # ... claude-fallback stays as-is
```

LiteLLM will distribute requests across both, cool down a failing one
(`cooldown_time`), and still fall back to Claude if **all** local replicas fail.
To scale the gateway itself, raise `deploy.replicas` on the `litellm` service
(stateless — safe to run N).

## Validation / smoke test

```bash
# Compose validity
docker compose -f docker-compose.prod.yml config -q

# After deploy, from inside the yt-prod network:
curl -s http://litellm:4000/health/liveliness
curl -s http://litellm:4000/v1/models                       # should list yt-llm, qwen2.5
curl -s http://litellm:4000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"yt-llm","messages":[{"role":"user","content":"ping"}]}'
```

To prove the fallback: stop/break Ollama and re-run the last call — it should
return a Claude completion instead of erroring (requires `ANTHROPIC_API_KEY`).
