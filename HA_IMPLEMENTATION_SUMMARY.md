# High Availability Implementation Summary

## Overview

A production-grade High Availability setup has been implemented for the YouTube Transcriber. The deployment uses:

- **nginx reverse proxy** as the public entry point (port 4000)
- **Two app instances** running in parallel (ports 4001-4002, internal)
- **Docker health checks** for automatic failure detection
- **Graceful shutdown handling** for zero-downtime updates
- **Reboot tracking** to flag problematic containers

---

## Files Created

### 1. `/app/api/health/route.ts`
**Purpose:** Health check endpoint with SIGTERM handling and reboot tracking

**Key Features:**
- `GET /api/health` returns 200 when healthy
- Returns 503 when container is shutting down (SIGTERM received)
- Tracks reboot count in `/tmp/reboot-count.json`
- Warns if >5 reboots in 1 hour
- Listens for SIGTERM signal to initiate graceful shutdown

**Lines:** ~80 (TypeScript)

### 2. `/nginx.conf`
**Purpose:** Load balancer configuration

**Key Features:**
- Round-robin load balancing between app-4001 and app-4002
- Upstream server health checking (3 failures = 30s timeout)
- Keep-alive connections to backends
- Support for WebSockets and long-running requests (600s timeout)
- Preserves original request headers (X-Forwarded-For, etc.)
- Request buffering and logging

**Lines:** ~55

### 3. `/HA_DEPLOYMENT.md`
**Purpose:** Complete deployment guide for operations team

**Contents:**
- Architecture overview with diagram
- Detailed implementation explanations
- Step-by-step deployment instructions
- Monitoring and logging commands
- Rolling update procedures
- Troubleshooting guide with common scenarios
- Performance tuning recommendations
- Scaling to more instances

**Lines:** ~400

### 4. `/HA_QUICK_REFERENCE.md`
**Purpose:** Quick-start guide for developers and ops

**Contents:**
- What changed (summary)
- Quick start commands
- Port mapping reference
- Health check behavior explanation
- Monitoring commands
- Zero-downtime deployment steps
- Troubleshooting quick fixes
- Production checklist

**Lines:** ~250

### 5. `/HA_TEST_GUIDE.md`
**Purpose:** Comprehensive testing procedures

**Contents:**
- 10 detailed test scenarios:
  1. Basic startup and health
  2. Health endpoint responses
  3. Load balancer round-robin
  4. Graceful shutdown
  5. Health check failure recovery
  6. Reboot tracking
  7. Zero-downtime rolling updates
  8. Load testing procedures
  9. Resource limits verification
  10. Failure scenario handling
- Debugging commands
- Verification checklist
- Next steps for production

**Lines:** ~500

---

## Files Modified

### 1. `/Dockerfile`
**Change:** Added HEALTHCHECK directive

**Before:**
```dockerfile
CMD ["node", "server.js"]
```

**After:**
```dockerfile
# Health check: GET /api/health with 30s interval, 3 retries, 10s timeout
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode); })" || exit 1

CMD ["node", "server.js"]
```

**Impact:**
- Docker now monitors container health automatically
- Failed health checks trigger automatic container restart
- nginx can observe health status and route accordingly

### 2. `/docker-compose.yml`
**Change:** Replaced single app service with HA setup

**Additions:**
- `nginx` service (nginx:1.27-alpine, port 4000)
- `app-4001` service (replica of app, port 4001)
- `app-4002` service (replica of app, port 4002)
- `youtube-transcriber-network` (custom bridge network)
- `nginx_logs` volume for logging
- `stop_grace_period: 30s` on app services (graceful shutdown)
- Service dependencies for startup ordering

**Key Differences from Original:**
- Old: Single `app` service on port 4000
- New: `nginx` (4000) → `app-4001` (4001) + `app-4002` (4002)
- All services on custom network for isolation
- Both app instances share Redis and environment variables

**Impact:**
- Users access port 4000 (goes through nginx)
- nginx automatically load-balances between app instances
- Containers have up to 30 seconds for graceful shutdown
- Health checks run continuously

---

## Architecture Changes

### Before (Single Container)
```
User → Port 4000 → Docker Container → Redis/Supabase
```

### After (HA Setup)
```
User → Port 4000 → nginx (reverse proxy & load balancer) → {
  ├─ App Instance 1 (port 4001)
  └─ App Instance 2 (port 4002)
} → Redis/Supabase (shared)
```

---

## How It Works

### 1. Health Checking (Automatic Container Monitoring)

**Interval:** Every 30 seconds per container

**Flow:**
```
Docker → GET /api/health → App Instance
         ↓
         200 OK? → Mark healthy
         ↓
         503 or timeout? → Increment failure count
         ↓
         >3 failures? → Mark unhealthy & potentially restart
```

### 2. Load Balancing (Request Distribution)

**Pattern:** Round-robin (alternating between instances)

```
Request 1 → nginx → app-4001
Request 2 → nginx → app-4002
Request 3 → nginx → app-4001 (if healthy)
Request 4 → nginx → app-4002 (if healthy)
```

**Automatic Failover:**
- If app-4001 is unhealthy, all traffic goes to app-4002
- If app-4002 becomes healthy again, traffic resumes load balancing

### 3. Graceful Shutdown (Zero-Downtime Updates)

**Trigger:** `docker-compose restart app-4001`

**Flow:**
```
1. Docker sends SIGTERM to container
2. process.on('SIGTERM') handler executes
   ├─ Sets isShuttingDown = true
   └─ Records reboot timestamp
3. Health check returns 503 (Service Unavailable)
4. nginx detects failure, stops routing new requests
5. Existing requests complete (up to 30s grace period)
6. Container exits cleanly
7. Docker applies restart policy (unless-stopped)
8. New instance starts, health check passes
9. nginx resumes routing traffic to it
```

### 4. Reboot Tracking (Automatic Issue Detection)

**File:** `/tmp/reboot-count.json`

**Example:**
```json
{
  "reboots": [
    1718313600000,
    1718313700000,
    1718313800000
  ]
}
```

**Alert:** If reboots.length > 5 in 1 hour:
```
[HEALTH] WARNING: Container has rebooted 6 times in the last hour. Manual intervention may be required.
```

**Typical Causes:**
- Memory leaks (OOM killer restarting container)
- Unhandled exceptions (app crashing)
- Dependency timeouts (Redis, Supabase connectivity)
- Resource exhaustion (CPU, disk)
- Misconfiguration

---

## Deployment Quick Start

```bash
# Prerequisites: env vars set in .env.local
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, etc.

# Start the HA deployment
docker-compose up -d

# Verify all services are running and healthy
docker-compose ps

# Test public endpoint
curl http://localhost:4000/api/health

# Monitor logs
docker-compose logs -f
```

---

## Key Metrics & Monitoring

### What to Monitor

1. **Container Health Status**
   - Should see: `Up X seconds (healthy)`
   - Alert if: `unhealthy` for >1 minute

2. **Reboot Count**
   - Normal: 0-2 reboots in 1 hour
   - Alert if: >5 reboots in 1 hour

3. **Request Latency**
   - Monitor via nginx logs: `response_time`
   - Alert if: p95 > 1s or p99 > 5s

4. **nginx Backend Failures**
   - Monitor: upstream failures in nginx error log
   - Alert if: failures > 10/hour

5. **Resource Usage**
   - CPU: Should be <80% per instance under normal load
   - Memory: Should be stable (watch for leaks)
   - Disk: Ensure >20% free space

### Commands

```bash
# Health status
docker-compose ps

# Resource usage
docker stats

# Reboot tracking
docker-compose exec app-4001 cat /tmp/reboot-count.json

# Recent logs
docker-compose logs app-4001 app-4002 | tail -50

# nginx access log
docker-compose logs nginx | grep -v "health"
```

---

## Production Checklist

- [ ] Tested locally with `docker-compose up -d`
- [ ] Verified `docker-compose ps` shows 4 services: nginx, app-4001, app-4002, redis
- [ ] All health checks passing (status shows "healthy")
- [ ] Tested graceful shutdown: `docker-compose restart app-4001`
- [ ] Verified zero-downtime: traffic continues during restart
- [ ] Reboot tracking working: checked `/tmp/reboot-count.json`
- [ ] nginx logs showing proper round-robin distribution
- [ ] Environment variables correctly set for both app instances
- [ ] Redis connectivity working from both instances
- [ ] Load tested with realistic traffic patterns
- [ ] Set up automated monitoring and alerting
- [ ] Documented runbooks for ops team
- [ ] Scheduled regular health drills

---

## Performance Impact

### Positive
- **Availability:** 2x reliability (1 instance can fail)
- **Scalability:** Easy to add more instances
- **Maintainability:** Zero-downtime updates
- **Observability:** Health checks + reboot tracking

### Negligible Overhead
- **Latency:** nginx reverse proxy adds ~1-2ms
- **Memory:** nginx uses ~10-20MB, slight overhead for 2nd app instance
- **CPU:** nginx is highly optimized, minimal impact
- **Disk:** nginx logs may grow (monitor `/var/log/nginx/access.log`)

---

## Common Operations

### Rolling Update (Update Code)
```bash
git pull origin main
docker-compose build
docker-compose restart app-4001
sleep 10  # Wait for health check
docker-compose restart app-4002
```

### Add a Third Instance
1. Duplicate `app-4002` service in docker-compose.yml → `app-4003`
2. Change port to `4003:3000`
3. Add to upstream in nginx.conf: `server app-4003:3000 ...;`
4. Restart nginx: `docker-compose restart nginx`

### Increase Grace Period (Long-Running Requests)
```yaml
# In docker-compose.yml
stop_grace_period: 60s  # Increase from 30s
```

### Scale Up/Down
- Scale up: Add more app instances (see "Add a Third Instance" above)
- Scale down: Remove instances from docker-compose.yml and nginx.conf

---

## Troubleshooting

### All services start but health checks fail

```bash
# Check logs
docker-compose logs app-4001

# Common causes:
# - Missing env vars
# - Supabase/Clerk connectivity issue
# - Port conflicts with existing containers
# - Node.js build error
```

### nginx shows "unhealthy" for all upstreams

```bash
# Verify app instances are running
docker-compose ps

# Check if nginx can reach them
docker-compose exec nginx ping app-4001
docker-compose exec nginx ping app-4002

# Check nginx error log
docker-compose logs nginx | grep error
```

### High reboot count warning

```bash
# Check what's causing restarts
docker-compose logs app-4001 app-4002 | grep -i "error\|exception\|fatal"

# Monitor resources during startup
docker stats app-4001 app-4002

# If memory is the issue:
# - Add memory limits in docker-compose.yml
# - Check for memory leaks in Next.js app
# - Monitor with: docker stats
```

---

## Next Steps

1. **Test locally** using HA_TEST_GUIDE.md
2. **Deploy to staging** environment
3. **Run load tests** to verify capacity
4. **Set up monitoring** (Prometheus, DataDog, etc.)
5. **Configure alerting** on health status + reboot count
6. **Train ops team** on deployment procedures
7. **Deploy to production** with zero-downtime procedure

---

## References

- `HA_DEPLOYMENT.md` — Full deployment guide
- `HA_QUICK_REFERENCE.md` — Quick-start for developers
- `HA_TEST_GUIDE.md` — Testing procedures
- `docker-compose.yml` — Service configuration
- `Dockerfile` — Container build with health check
- `/app/api/health/route.ts` — Health endpoint implementation

---

## Support

For issues or questions:
1. Check relevant guide above
2. Review logs: `docker-compose logs -f`
3. Run diagnostics: See "Debugging Commands" in HA_TEST_GUIDE.md
4. Consult troubleshooting section in this file

Implementation Date: 2024-06-13
Next Review: After first week of production deployment
