# YT Transcriber — Monitoring & Alerting Stack

A **standalone** Docker Swarm observability stack for the YT Transcriber estate.
It is deliberately separate from `docker-compose.prod.yml` so it can be deployed,
updated, and rolled back independently of the app stack (and avoids conflicts
with other in-flight PRs).

This stack closes the "no monitoring/alerting" gap and is the data backend the
future **Sentinel** ops console will read from (Prometheus + Loki).

---

## What runs

| Service        | Image                              | Mode    | Purpose |
|----------------|------------------------------------|---------|---------|
| `prometheus`   | `prom/prometheus:v2.53.1`          | 1       | Metrics store, scrape engine, alert evaluator |
| `node-exporter`| `prom/node-exporter:v1.8.2`        | global  | Host CPU/mem/disk/net metrics — one per node |
| `cadvisor`     | `gcr.io/cadvisor/cadvisor:v0.49.1` | global  | Per-container resource metrics — one per node |
| `loki`         | `grafana/loki:3.1.1`               | 1       | Log store |
| `promtail`     | `grafana/promtail:3.1.1`           | global  | Ships each node's Docker logs to Loki — one per node |
| `grafana`      | `grafana/grafana:11.1.4`           | 1       | Dashboards (Prometheus + Loki datasources, overview dashboard) |
| `alertmanager` | `prom/alertmanager:v0.27.0`        | 1       | Routes Prometheus alerts to receivers |
| `uptime-kuma`  | `louislam/uptime-kuma:1.23.16`     | 1       | External/black-box endpoint probing (yt.bentech.dev, etc.) |

**Named volumes** (data persistence): `prometheus-data`, `grafana-data`,
`loki-data`, `uptime-kuma-data`.

**Networks**:
- `monitoring` — private overlay for internal stack traffic (created by this stack).
- `yt-prod` — the app's production overlay, declared **external** here so
  Prometheus can scrape app targets cross-stack (see caveat below).
- `proxy` — the existing Nginx Proxy Manager overlay, used to expose Grafana /
  Uptime-Kuma UIs.

---

## Required environment variables

Set these in the stack's `.env` (or the Portainer stack env editor):

| Var | Required | Purpose |
|-----|----------|---------|
| `GRAFANA_ADMIN_PASSWORD` | **yes** | Grafana admin password (deploy fails without it). |
| `GRAFANA_ROOT_URL`       | recommended | Public URL when behind NPM, e.g. `https://grafana.bentech.dev`. |
| `ALERT_WEBHOOK_URL`      | optional | Slack/generic webhook for Alertmanager. **Not** auto-substituted — see Alerting. |
| `SMTP_SMARTHOST` / `SMTP_FROM` | optional | Email alert placeholders — see Alerting. |
| `YT_PROD_NETWORK`        | optional | Actual deployed name of the app overlay (default `yt_yt-prod`). See caveat. |

---

## Deploying

```bash
# from the repo root (where docker-compose.monitoring.yml lives, so the
# `configs: file:` relative paths resolve):
export GRAFANA_ADMIN_PASSWORD='change-me'
export GRAFANA_ROOT_URL='https://grafana.bentech.dev'

docker stack deploy -c docker-compose.monitoring.yml monitoring
```

- Swarm **configs are immutable**. After editing any file under
  `deploy/monitoring/`, bump the matching config name (e.g. add `_v2`) in
  `docker-compose.monitoring.yml` before redeploying, otherwise Swarm keeps the
  old content.
- `docker stack deploy` does not read `.env` automatically the way
  `docker compose up` does — export the vars (or use Portainer's env editor).

Validate locally before deploying:

```bash
docker compose -f docker-compose.monitoring.yml config -q
```

---

## Reaching Grafana via NPM

Grafana listens on **port 3000 internally** and is **not** published broadly
(no host port mapping). Expose it through Nginx Proxy Manager:

1. Grafana is attached to the `proxy` overlay.
2. In NPM add a Proxy Host: forward `grafana.bentech.dev` →
   `grafana` (port `3000`). NPM and Grafana share the `proxy` network so the
   service name resolves.
3. Set `GRAFANA_ROOT_URL=https://grafana.bentech.dev` so redirects/links work.
4. Add TLS (Let's Encrypt) in NPM.

Uptime-Kuma (port `3001` internally) is exposed the same way if you want its UI
reachable; otherwise reach it only on the overlay.

---

## Alerting

`deploy/monitoring/alertmanager.yml` ships with a **placeholder** webhook
receiver and commented SMTP/email blocks.

> Alertmanager does **not** expand `${ENV}` variables inside its config file at
> runtime. The `ALERT_WEBHOOK_URL` / `SMTP_*` env vars are surfaced on the
> service for documentation, but you must put the real values into
> `deploy/monitoring/alertmanager.yml` directly (then bump the config name and
> redeploy), or template the file in your pipeline / mount a secret.

Starter alert rules (`deploy/monitoring/alert-rules.yml`):

- **NodeDown** — a node-exporter target unreachable for 2m.
- **HighCpuUsage** — CPU > 90% for 5m (per node).
- **HighMemoryUsage** — available memory < 10% for 5m (OOM risk).
- **DiskSpaceLow** — root/data filesystem < 15% free for 10m.
- **ContainerRestartLoop** — a container restarted >1× in 5m.
- **ContainerHighMemory** — container > 90% of its memory limit for 5m.
- **TargetDown** — any Prometheus scrape target down for 2m.

---

## Cross-stack scraping of app targets (CAVEAT)

Prometheus is attached to the external `yt-prod` overlay so it can scrape the
app and worker once they expose `/metrics`. Two things to verify:

1. **Network name.** When the app stack is deployed (`docker stack deploy …
   <name>`), Swarm prefixes its network as `<name>_yt-prod`. This stack defaults
   to `yt_yt-prod`. Confirm with `docker network ls` and override via
   `YT_PROD_NETWORK` if the prod stack is named differently.
2. **App `/metrics` endpoint.** The app does not expose Prometheus metrics yet.
   The `yt-app` / `yt-whisper-worker` jobs in `deploy/monitoring/prometheus.yml`
   are **commented out** — uncomment them when the endpoint exists. They use
   `tasks.<service>` DNS so every replica is scraped, not just the VIP.

If you'd rather not couple the stacks, an alternative is to scrape app targets
via the Swarm tasks DNS from within the app stack and remote-write to this
Prometheus — but the attached-overlay approach above is simpler for now.

---

## Multi-host notes

The estate is currently **1 Swarm node** (2–3 soon). This stack is built to
scale without edits:

- **Exporters are `mode: global`** (`node-exporter`, `cadvisor`, `promtail`):
  Swarm runs exactly one task per node automatically as nodes join. Prometheus
  discovers all of them via `tasks.<service>` DNS (A records = every node).
- **Central services** (`prometheus`, `grafana`, `loki`, `alertmanager`,
  `uptime-kuma`) currently use a **soft `spread` placement preference** so they
  schedule fine on a single node. Each carries a **commented hard constraint**:

  ```yaml
  # constraints:
  #   - node.labels.role == mgmt
  ```

  When the dedicated management node exists, label it
  (`docker node update --label-add role=mgmt <node>`), uncomment the
  constraints, and the central stack pins itself there — keeping
  observability off the app/worker nodes.
- Named volumes are local to the node a service runs on. Once central services
  are pinned to the mgmt node this is fine; if you need them to float across
  nodes, move to a shared/clustered volume driver.

---

## Wiring app logs into Loki later

`app-ha/lib/event-log.ts` already has an **env-gated sink extension point** (it
mentions Sentry / Datadog / **Loki**). The app currently logs to stdout
(captured by promtail → Loki) and to the `event_logs` DB table. To push
structured events straight to Loki, add a `LogSink` guarded by `process.env.LOKI_URL`
and push it onto the `sinks` array — no caller changes needed. Point
`LOKI_URL` at `http://loki:3100` (the app must be on the `monitoring` overlay,
or expose Loki on `yt-prod`).
