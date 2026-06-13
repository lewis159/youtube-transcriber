# High Availability - Testing Guide

This guide walks through testing the HA setup to verify all components work correctly.

---

## Test 1: Basic Startup and Health

**Objective:** Verify all services start correctly and are healthy.

```bash
# Start the deployment
docker-compose up -d

# Wait 5-10 seconds for containers to initialize
sleep 10

# Check status
docker-compose ps

# Expected output:
# CONTAINER ID   IMAGES              STATUS
# ...            nginx:1.27          Up X seconds
# ...            youtube-transcriber App instance 1 health
# ...            youtube-transcriber App instance 2 healthy
# ...            redis:7             Up X seconds
```

All containers should show `Up X seconds (healthy)` or just `Up X seconds` for redis.

---

## Test 2: Health Endpoint Responses

**Objective:** Verify the health endpoint returns correct status codes.

### Test healthy instances

```bash
# Test app instance 1 directly
curl -v http://localhost:4001/api/health
# Expected: 200 OK with JSON response

# Test app instance 2 directly
curl -v http://localhost:4002/api/health
# Expected: 200 OK with JSON response

# Test through load balancer
curl -v http://localhost:4000/api/health
# Expected: 200 OK (will hit either 4001 or 4002)
```

Sample healthy response:
```json
{
  "status": "healthy",
  "message": "Application is running and ready to serve requests",
  "timestamp": "2024-06-13T20:45:00.000Z",
  "uptime": 125.5
}
```

---

## Test 3: Load Balancer Round-Robin

**Objective:** Verify nginx is distributing requests across both instances.

```bash
# Run 10 requests and check which instance handled each
for i in {1..10}; do
  echo "Request $i:"
  curl -s http://localhost:4000/api/health | jq '.uptime'
done

# Check nginx logs to see which backends were hit
docker-compose logs nginx | grep -i "upstream:"
# Or check request distribution
docker-compose logs nginx | tail -20
```

You should see requests going to both `app-4001:3000` and `app-4002:3000` in an alternating pattern.

---

## Test 4: Graceful Shutdown

**Objective:** Verify that stopping a container gracefully drains connections.

### Setup a long-running request

Terminal 1 - Start a slow request:
```bash
# This simulates a request that takes ~20 seconds
curl -v http://localhost:4000/ &  # or any endpoint that processes data

# On one of the app instances
sleep 2  # Give it a moment to start
```

Terminal 2 - Monitor the instance and trigger shutdown:
```bash
# Watch container status
watch -n 1 'docker-compose ps'

# Check health status during shutdown
watch -n 1 'curl -s http://localhost:4001/api/health | jq ".status"'
```

Terminal 3 - Stop one app instance:
```bash
# Stop app-4001 (simulates restart/update)
docker-compose stop app-4001

# Expected behavior:
# 1. Container receives SIGTERM
# 2. Health endpoint returns 503 for ~5 seconds
# 3. Existing requests complete
# 4. Container stops cleanly
# 5. All traffic routes to app-4002

# Restart it
docker-compose start app-4001

# Wait for health check to pass
sleep 5
docker-compose ps  # Should show "healthy" again
```

---

## Test 5: Health Check Failure Recovery

**Objective:** Verify that unhealthy instances are removed from rotation.

### Trigger an unhealthy state (simulate a crash)

```bash
# Kill the Next.js process in app-4001 (not the container itself)
docker-compose exec app-4001 killall node

# Monitor what happens
watch -n 1 'docker-compose ps'

# Expected behavior:
# 1. app-4001 shows "unhealthy" after ~30 seconds (3 failed health checks)
# 2. nginx automatically routes all traffic to app-4002
# 3. All user requests continue to be served
# 4. Docker auto-restart kicks in (restart: unless-stopped)
# 5. app-4001 recovers and becomes healthy again

# Monitor health
for i in {1..15}; do
  echo "Check $i ($(date)):"
  docker-compose ps | grep -E "app-4001|app-4002"
  sleep 2
done

# Once recovered, verify both instances are healthy
curl -s http://localhost:4001/api/health | jq '.status'
curl -s http://localhost:4002/api/health | jq '.status'
```

---

## Test 6: Reboot Tracking

**Objective:** Verify that reboots are tracked and warnings are logged.

### Trigger multiple reboots

```bash
# First, check the initial state
docker-compose exec app-4001 cat /tmp/reboot-count.json 2>/dev/null || echo "File not found (first run)"

# Trigger a reboot (stop and start)
docker-compose restart app-4001

# Check if reboot was recorded
docker-compose exec app-4001 cat /tmp/reboot-count.json

# Expected output after first restart:
# {
#   "reboots": [1718313600123]
# }

# Trigger 5 more reboots rapidly
for i in {1..5}; do
  docker-compose restart app-4001
  sleep 2
done

# Check the reboot count file
docker-compose exec app-4001 cat /tmp/reboot-count.json

# Expected: 6 reboot timestamps in last 1 hour

# Check logs for warning
docker-compose logs app-4001 | grep "WARNING\|rebooted"

# Expected warning message:
# [HEALTH] WARNING: Container has rebooted 6 times in the last hour. Manual intervention may be required.
```

---

## Test 7: Zero-Downtime Rolling Update

**Objective:** Simulate a code deployment with no downtime.

```bash
# Terminal 1 - Continuous health check (monitoring traffic)
watch -n 1 'curl -s http://localhost:4000/api/health | jq ".uptime"'

# Terminal 2 - Monitoring container health
watch -n 1 'docker-compose ps'

# Terminal 3 - Perform the update
echo "Step 1: Restart app-4001 (app-4002 handles traffic)"
docker-compose restart app-4001
sleep 10  # Wait for health check

echo "Step 2: Restart app-4002 (app-4001 handles traffic)"
docker-compose restart app-4002
sleep 10  # Wait for health check

echo "Step 3: Both instances are now updated and healthy"
docker-compose ps
```

Expected behavior:
- Health checks in Terminal 1 never fail
- Terminal 2 always shows at least one healthy instance
- No user-facing downtime
- Existing connections drain gracefully during each restart

---

## Test 8: Load Testing

**Objective:** Verify HA setup handles concurrent traffic.

### Using Apache Bench (ab)

```bash
# 1000 requests, 10 concurrent connections
ab -n 1000 -c 10 http://localhost:4000/

# For a longer test (60 seconds at 10 req/sec)
# You may need to install a tool like `wrk` or use k6
```

### Using wrk (if installed)

```bash
# 4 threads, 100 connections, 30 second test
wrk -t4 -c100 -d30s http://localhost:4000/

# Monitor during test
watch -n 1 'docker stats'
```

### Using k6 (JavaScript-based load testing)

```javascript
// save as load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up
    { duration: '60s', target: 50 },   // Sustained load
    { duration: '30s', target: 0 },    // Ramp-down
  ],
};

export default function () {
  let response = http.get('http://localhost:4000/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'is healthy': (r) => r.body.includes('healthy'),
  });
}
```

```bash
# Run the test (requires k6 installed: https://k6.io)
k6 run load-test.js
```

Expected results:
- All requests succeed
- Response times remain consistent
- No container crashes or restarts
- nginx distributes load evenly
- No "unhealthy" status in docker-compose ps

---

## Test 9: Container Resource Limits

**Objective:** Verify behavior under resource constraints.

### Monitor resource usage

```bash
# Real-time monitoring
docker stats

# Check limits (if set)
docker-compose ps -a
docker inspect app-4001 | grep -i memory
docker inspect app-4001 | grep -i cpu
```

### Simulate high memory usage (optional)

If you want to test behavior under memory pressure:

```bash
# Add memory limits to docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 512M
#     reservations:
#       memory: 256M

docker-compose down
docker-compose up -d

# Monitor when memory pressure is applied
watch -n 1 'docker stats'
```

---

## Test 10: Failure Scenarios

### Scenario A: Redis becomes unavailable

```bash
# Stop Redis
docker-compose stop redis

# Try to access the app (session operations will fail)
curl -v http://localhost:4000/

# Check logs
docker-compose logs app-4001 | tail -20

# Restart Redis
docker-compose start redis

# Verify recovery
sleep 5
curl -v http://localhost:4000/
```

### Scenario B: One instance is completely down

```bash
# Remove app-4001 from the network (simulate hard failure)
docker-compose down app-4001

# All traffic should route to app-4002
for i in {1..5}; do
  curl -v http://localhost:4000/api/health
done

# Restart it
docker-compose up -d app-4001

# Wait for health check
sleep 10

# Verify both instances are handling traffic
docker-compose ps
```

### Scenario C: nginx is down

```bash
# Stop nginx
docker-compose stop nginx

# The load balancer is unavailable
curl -v http://localhost:4000/  # Will fail

# But app instances are still running
curl -v http://localhost:4001/api/health  # Works
curl -v http://localhost:4002/api/health  # Works

# Restart nginx
docker-compose start nginx

# Verify traffic flows again
sleep 5
curl -v http://localhost:4000/api/health
```

---

## Verification Checklist

- [ ] All 4 services start successfully
- [ ] Health endpoint returns 200 on both app instances
- [ ] Load balancer distributes requests to both instances
- [ ] Stopping one instance doesn't cause downtime
- [ ] Health check failures are logged and traffic is rerouted
- [ ] Reboots are tracked in `/tmp/reboot-count.json`
- [ ] Warning appears after >5 reboots in 1 hour
- [ ] Zero-downtime rolling updates work
- [ ] Load test succeeds with no failures
- [ ] Container gracefully handles SIGTERM
- [ ] All endpoints remain accessible during updates

---

## Debugging Commands

```bash
# View all logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app-4001

# Check container health status
docker ps --format "{{.Names}}\t{{.Status}}"

# Inspect a container
docker-compose exec app-4001 sh
# Inside the container:
# ps aux  # See running processes
# cat /tmp/reboot-count.json  # Check reboots
# exit

# Check network connectivity
docker-compose exec app-4001 ping app-4002

# View nginx configuration
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf

# Check nginx status
docker-compose exec nginx nginx -T

# View real-time request logs
docker-compose logs -f nginx | grep -v "health"
```

---

## Next Steps

Once all tests pass:

1. **Load test with realistic traffic patterns** (your typical user behavior)
2. **Set up monitoring** (Prometheus, Grafana, DataDog, etc.)
3. **Configure alerting** on:
   - Container health status
   - Reboot count >5 in 1 hour
   - nginx backend failures
   - Response time degradation
4. **Document failure procedures** for your ops team
5. **Plan regular disaster recovery drills** (simulated failures)
6. **Deploy to production** with confidence

See `HA_DEPLOYMENT.md` for full implementation details.
