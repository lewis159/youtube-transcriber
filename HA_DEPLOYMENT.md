# High Availability Deployment Guide

## Overview

This YouTube Transcriber deployment implements high availability with:
- **nginx reverse proxy** on port 4000 (public entry point)
- **Two app instances** on ports 4001 and 4002 (internal, round-robin load balanced)
- **Docker health checks** that ensure containers are only marked ready after health verification
- **Graceful shutdown handling** that stops accepting new connections and drains existing requests on SIGTERM
- **Reboot tracking** that flags containers needing manual intervention if they reboot >5 times in 1 hour

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ External Traffic (port 4000)                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                        ┌──────▼──────────┐
                        │   nginx         │
                        │ (load balancer) │
                        └──────┬──────┬───┘
                               │      │
              ┌────────────────┘      └──────────────────┐
              │                                           │
       ┌──────▼────────┐                         ┌───────▼──────┐
       │  app-4001     │                         │   app-4002   │
       │   port 4001   │                         │   port 4002  │
       │   (internal)  │                         │   (internal) │
       └──────┬────────┘                         └───────┬──────┘
              │                                           │
              └────────────────┬───────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Redis     │
                        │  (session)  │
                        └─────────────┘
```

---

## Files Created/Modified

### New Files

1. **`app/api/health/route.ts`**
   - Health check endpoint at `GET /api/health`
   - Returns 200 when healthy, 503 when shutting down
   - Tracks reboot count in `/tmp/reboot-count.json`
   - Warns if >5 reboots in 1 hour

2. **`nginx.conf`**
   - Reverse proxy configuration
   - Round-robin load balancing between app-4001 and app-4002
   - Supports WebSockets and long-running requests
   - Preserves original request headers

### Modified Files

1. **`Dockerfile`**
   - Added `HEALTHCHECK` directive with:
     - 30s interval between checks
     - 10s timeout per check
     - 3 retry attempts before marking unhealthy
     - 5s start period for container startup

2. **`docker-compose.yml`**
   - Replaced single app service with app-4001 and app-4002
   - Added nginx service on port 4000
   - Added 30s grace period for graceful shutdown
   - Created docker network for container communication

---

## How It Works

### Load Balancing

nginx uses round-robin load balancing:
- Request 1 → app-4001
- Request 2 → app-4002
- Request 3 → app-4001
- And so on...

If one instance becomes unhealthy, nginx marks it as `fail_timeout=30s` and routes traffic to the healthy instance.

### Health Checks

Docker runs the health check command every 30 seconds:
```bash
curl -f http://localhost:3000/api/health || exit 1
```

The health endpoint:
- **Returns 200 + uptime** when the app is running normally
- **Returns 503** when the container has received SIGTERM and is shutting down
- Docker marks the container as "unhealthy" after 3 consecutive failures
- nginx observes the health status and removes unhealthy containers from rotation

### Graceful Shutdown

When a container receives SIGTERM (e.g., during restart/update):

1. **Signal Handler Triggered**
   - `process.on('SIGTERM')` is activated
   - `isShuttingDown` flag is set to `true`

2. **Health Check Fails**
   - New health checks return 503
   - nginx stops routing new requests to this container (within 30s)
   - Existing requests continue to completion

3. **Grace Period**
   - Docker waits up to 30s (`stop_grace_period: 30s`)
   - Existing connections drain naturally
   - Process exits cleanly

4. **Reboot Tracking**
   - Reboot timestamp is recorded in `/tmp/reboot-count.json`
   - If >5 reboots in 1 hour, a warning is logged
   - Requires manual investigation (possible resource exhaustion, crashes, misconfiguration)

### Reboot Tracking

The health endpoint tracks reboots in `/tmp/reboot-count.json`:
```json
{
  "reboots": [1718313600000, 1718313700000, 1718313800000]
}
```

**Alert Threshold:** >5 reboots in 1 hour

**Manual Actions to Take:**
- Check container logs: `docker logs app-4001`
- Monitor system resources: `docker stats app-4001 app-4002`
- Verify Clerk/Supabase connectivity
- Check disk space: `df -h`
- Check Redis connection status

---

## Deployment Steps

### Prerequisites

- Docker and Docker Compose installed
- All environment variables set in `.env.local` or shell:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - (All CLERK Clerk sign-in/up URLs)

### Build and Deploy

```bash
# Pull latest code
git pull origin main

# Build images (one-time, or after code changes)
docker-compose build

# Start the HA deployment
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check health status of app instances
curl http://localhost:4001/api/health
curl http://localhost:4002/api/health

# Test public endpoint
curl http://localhost:4000/api/health
```

### Monitoring

```bash
# View logs for all services
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f app-4001
docker-compose logs -f nginx

# Check container health status
docker ps --format "{{.Names}}\t{{.Status}}"

# Check resource usage
docker stats

# View reboot tracking file
docker exec app-4001 cat /tmp/reboot-count.json
```

### Rolling Updates

To update the application without downtime:

```bash
# Pull latest code
git pull origin main

# Rebuild only the changed images
docker-compose build

# Restart one instance at a time
docker-compose restart app-4001
# Wait for it to be healthy (docker ps should show "healthy")
sleep 10

# Restart second instance
docker-compose restart app-4002

# Verify both are healthy
docker-compose ps
```

The deployment ensures:
1. At least one instance is always serving traffic
2. nginx stops routing to unhealthy instances
3. Graceful draining allows existing requests to complete
4. No user sessions are abruptly disconnected

---

## Troubleshooting

### One Instance is Unhealthy

```bash
# Check logs
docker-compose logs app-4001

# Restart it
docker-compose restart app-4001

# Watch it recover
docker-compose ps
```

### High Reboot Count Warning

```bash
# Check if containers are crashing
docker-compose logs app-4001 app-4002 | tail -50

# Monitor resource usage
docker stats

# Check Supabase/Redis connectivity
docker-compose logs redis

# Restart all services
docker-compose restart app-4001 app-4002 redis
```

### nginx Load Balancer Issues

```bash
# Check nginx logs
docker-compose logs nginx

# Verify backend connectivity
docker-compose logs nginx | grep "upstream"

# Test app instances directly
curl -v http://localhost:4001/api/health
curl -v http://localhost:4002/api/health
```

### Graceful Shutdown Not Working

If containers are being forcefully killed instead of gracefully shutting down:

```bash
# Increase grace period in docker-compose.yml
# Change: stop_grace_period: 30s → 60s

# Restart containers
docker-compose down
docker-compose up -d
```

---

## Performance Tuning

### nginx Buffer Sizes

In `nginx.conf`, adjust for your traffic patterns:
```nginx
proxy_buffer_size 4k;        # Initial response header
proxy_buffers 8 4k;          # Total buffered content
proxy_busy_buffers_size 8k;  # How much to flush at once
```

For high-volume traffic, increase these values.

### Health Check Sensitivity

In `Dockerfile`, adjust health check interval/timeout:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3
```

- **Lower interval** = faster failure detection (higher CPU cost)
- **Lower timeout** = faster health decision (may cause false positives)
- **Higher retries** = more tolerance for transient failures

### Connection Pool Sizes

In `nginx.conf`:
```nginx
upstream app_backend {
  keepalive 32;  # Number of idle connections to reuse
}
```

Increase for higher concurrency.

---

## Scaling to More Instances

To add a third app instance:

1. **Update docker-compose.yml:**
   - Copy the `app-4002` service
   - Rename to `app-4003`
   - Update port to `4003:3000`
   - Add to dependencies in nginx service

2. **Update nginx.conf:**
   ```nginx
   upstream app_backend {
     server app-4001:3000 max_fails=3 fail_timeout=30s;
     server app-4002:3000 max_fails=3 fail_timeout=30s;
     server app-4003:3000 max_fails=3 fail_timeout=30s;
     keepalive 32;
   }
   ```

3. **Reload nginx:**
   ```bash
   docker-compose restart nginx
   ```

---

## Health Check Endpoint Details

**Endpoint:** `GET /api/health`

**Healthy Response (200):**
```json
{
  "status": "healthy",
  "message": "Application is running and ready to serve requests",
  "timestamp": "2024-06-13T20:45:00.000Z",
  "uptime": 3600.25
}
```

**Shutting Down Response (503):**
```json
{
  "status": "shutting_down",
  "message": "Container is shutting down, no new requests accepted",
  "timestamp": "2024-06-13T20:46:00.000Z"
}
```

---

## Next Steps

1. **Test the HA deployment** with concurrent traffic
2. **Set up monitoring** (Prometheus, Grafana, DataDog, etc.)
3. **Configure automated backups** for database
4. **Document runbooks** for ops team (scaling, troubleshooting)
5. **Load test** with tools like `ab`, `wrk`, or `k6`
6. **Set up alerting** on reboot count and health status
