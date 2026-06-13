# High Availability - Quick Reference

## What Changed

### New Files
- `app/api/health/route.ts` — Health check endpoint with reboot tracking
- `nginx.conf` — Load balancer configuration
- `HA_DEPLOYMENT.md` — Full deployment guide

### Modified Files
- `Dockerfile` — Added HEALTHCHECK directive
- `docker-compose.yml` — Added nginx + 2 app instances + networks

---

## Quick Start

```bash
# Start the HA deployment
docker-compose up -d

# Verify all 3 services are running (nginx, app-4001, app-4002, redis)
docker-compose ps

# Test public endpoint (goes through nginx)
curl http://localhost:4000/api/health

# Test individual app instances
curl http://localhost:4001/api/health
curl http://localhost:4002/api/health
```

---

## Port Mapping

| Service    | Port  | Access      | Notes                        |
|------------|-------|-------------|------------------------------|
| nginx      | 4000  | Public      | Load balancer entry point    |
| app-4001   | 4001  | Internal    | First app instance (private) |
| app-4002   | 4002  | Internal    | Second app instance (private)|
| redis      | 6379  | Internal    | Session store (private)      |

**Users only access port 4000.** Ports 4001-4002 are internal only.

---

## Health Check Behavior

### How It Works

1. **Every 30 seconds**, Docker queries `GET /api/health` on each app instance
2. **If unhealthy (non-200 status):**
   - After 3 consecutive failures, container marked unhealthy
   - nginx stops routing new requests to it
   - Existing requests drain gracefully (up to 30s)
3. **If healthy:** Traffic continues normally with round-robin

### Graceful Shutdown on SIGTERM

When a container stops or restarts:

1. Receives SIGTERM signal
2. Health endpoint returns 503 (Service Unavailable)
3. nginx stops sending new requests (~30s to detect)
4. Existing requests have ~30s to complete
5. Container stops cleanly

### Reboot Tracking

- Reboot count tracked in `/tmp/reboot-count.json` on each instance
- If >5 reboots in 1 hour: warning logged to container logs
- Indicates potential issues (resource exhaustion, crashes, memory leaks)
- **Action:** Investigate logs, restart services, or scale up resources

---

## Monitoring Commands

```bash
# Check if containers are healthy
docker-compose ps
# Status shows: "Up X seconds (healthy)" or "Up X seconds (unhealthy)"

# View recent logs
docker-compose logs -n 50 app-4001 app-4002 nginx

# Check reboot count
docker-compose exec app-4001 cat /tmp/reboot-count.json

# Resource usage
docker stats

# Test endpoint through load balancer
watch -n 1 'curl -s http://localhost:4000/api/health | jq .'
```

---

## Updating the App

### Zero-Downtime Deployment

```bash
git pull origin main
docker-compose build
docker-compose restart app-4001  # Restart first instance
sleep 10                          # Wait for health check
docker-compose restart app-4002  # Restart second instance
```

This ensures:
- app-4001 is restarted while app-4002 handles traffic
- After app-4001 is healthy, app-4002 is restarted
- No downtime for users
- Graceful connection draining throughout

---

## Troubleshooting

### Container keeps restarting
```bash
# Check logs
docker-compose logs app-4001

# Common causes:
# 1. Missing env vars (check .env.local)
# 2. Supabase/Redis connection issues
# 3. Memory/disk space exhaustion
```

### One instance unhealthy
```bash
# Restart it
docker-compose restart app-4001

# Monitor recovery
watch -n 1 'docker-compose ps'
```

### High reboot count
```bash
# Check logs for errors
docker-compose logs app-4001 app-4002 | tail -100

# Restart everything
docker-compose restart app-4001 app-4002 redis

# If still failing, check:
docker stats  # Memory/CPU limits
df -h         # Disk space
```

---

## Architecture

```
User Request
    ↓
Port 4000 (nginx)
    ├─→ Round-robin to app-4001 (port 4001)
    ├─→ Round-robin to app-4002 (port 4002)
    ↓
Shared Redis (6379)
    ↓
Supabase Database
```

**Key Features:**
- ✅ Auto-load balancing (nginx round-robin)
- ✅ Auto-health monitoring (Docker HEALTHCHECK)
- ✅ Graceful shutdown (SIGTERM handler)
- ✅ Reboot tracking (>5 in 1 hour = warning)
- ✅ Zero-downtime updates (draining + grace period)

---

## Environment Variables

All variables from your `.env.local` are automatically passed to both app instances:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- (All Clerk URLs)

No changes needed — docker-compose.yml references them automatically.

---

## Production Checklist

- [ ] Tested with `docker-compose up -d` locally
- [ ] Verified `docker-compose ps` shows 4 services: nginx, app-4001, app-4002, redis
- [ ] Tested `curl http://localhost:4000/api/health` returns 200
- [ ] Tested graceful shutdown: `docker-compose stop app-4001`
- [ ] Verified existing requests complete during shutdown
- [ ] Monitored reboot count in `/tmp/reboot-count.json`
- [ ] Set up logging/alerting on reboot warnings
- [ ] Load tested with concurrent users (recommended: 100+ concurrent)
- [ ] Documented runbooks for ops team
- [ ] Set up automated health monitoring (DataDog, Prometheus, etc.)

---

## Next Steps

1. **Test locally** with the quick start commands above
2. **Deploy to staging** using the same docker-compose commands
3. **Load test** with tools like `k6` or `wrk` (target http://localhost:4000)
4. **Monitor for 1 hour** to verify reboot tracking works
5. **Deploy to production** with confidence in HA setup
6. **Set up alerts** on container health and reboot count

See `HA_DEPLOYMENT.md` for full implementation details and troubleshooting guides.
