# High Availability Infrastructure - Documentation Index

Welcome! This directory now contains a production-grade High Availability setup for the YouTube Transcriber. Here's how to navigate the documentation.

---

## Start Here

### For First-Time Setup
1. Read **[HA_QUICK_REFERENCE.md](HA_QUICK_REFERENCE.md)** (5 min read)
   - Overview of changes
   - Quick start commands
   - Port mappings
   
2. Run the quick start commands:
   ```bash
   docker-compose up -d
   docker-compose ps
   curl http://localhost:4000/api/health
   ```

3. Read **[HA_TEST_GUIDE.md](HA_TEST_GUIDE.md)** (20 min read)
   - Test Test 1-3 to verify basics work

### For Deployment
1. Read **[HA_DEPLOYMENT.md](HA_DEPLOYMENT.md)** (30 min read)
   - Complete architecture overview
   - Step-by-step deployment
   - Rolling update procedures
   - Troubleshooting guide

### For Operations/Monitoring
1. Reference **[HA_QUICK_REFERENCE.md](HA_QUICK_REFERENCE.md)** → Monitoring Commands section
2. Use **[HA_DEPLOYMENT.md](HA_DEPLOYMENT.md)** → Troubleshooting section

### For Full Testing
1. Follow all 10 tests in **[HA_TEST_GUIDE.md](HA_TEST_GUIDE.md)**
2. Verify against the checklist at the end

---

## Documentation Files

### [HA_QUICK_REFERENCE.md](HA_QUICK_REFERENCE.md) ⭐ START HERE
- **Length:** 5 min read
- **Audience:** Developers, DevOps
- **Contains:**
  - What changed in this deployment
  - Quick start commands
  - Port mapping reference
  - Health check explanation
  - Common monitoring commands
  - Troubleshooting quick fixes
  - Production checklist

### [HA_DEPLOYMENT.md](HA_DEPLOYMENT.md)
- **Length:** 30 min read
- **Audience:** Operations, DevOps, Architects
- **Contains:**
  - Full architecture diagram
  - Detailed implementation explanations
  - Files created/modified summary
  - How everything works
  - Deployment steps
  - Monitoring setup
  - Rolling update procedures
  - Troubleshooting guide
  - Performance tuning
  - Scaling recommendations

### [HA_TEST_GUIDE.md](HA_TEST_GUIDE.md)
- **Length:** 20 min to complete
- **Audience:** QA, DevOps, Developers
- **Contains:**
  - 10 comprehensive test scenarios:
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
  - Copy-paste commands for each test
  - Expected outputs
  - Debugging commands
  - Production verification checklist

### [HA_IMPLEMENTATION_SUMMARY.md](HA_IMPLEMENTATION_SUMMARY.md)
- **Length:** 15 min read
- **Audience:** Technical leads, Architects
- **Contains:**
  - Summary of all changes
  - Before/after architecture
  - How each component works
  - Key metrics to monitor
  - Common operations
  - Troubleshooting decision tree
  - Production checklist

---

## Code Changes

### Files Created

**[app/api/health/route.ts](app/api/health/route.ts)** (89 lines)
- Health check endpoint: `GET /api/health`
- Returns 200 when healthy, 503 when shutting down
- SIGTERM handler for graceful shutdown
- Reboot tracking in `/tmp/reboot-count.json`
- Warns if >5 reboots in 1 hour

**[nginx.conf](nginx.conf)** (55 lines)
- Reverse proxy configuration
- Round-robin load balancing
- Health checking upstream servers
- WebSocket support
- Long request timeout (600s for video processing)

### Files Modified

**[Dockerfile](Dockerfile)** (+4 lines)
- Added HEALTHCHECK directive
- 30s interval, 10s timeout, 3 retries
- Queries `/api/health` endpoint

**[docker-compose.yml](docker-compose.yml)** (Completely restructured)
- Added nginx service (port 4000, public)
- Split app into app-4001 and app-4002 (ports 4001-4002, internal)
- Added custom network: `youtube-transcriber-network`
- Added 30s grace period for graceful shutdown

---

## Architecture

### Simple View
```
User Traffic (port 4000)
    ↓
nginx (load balancer & reverse proxy)
    ├─→ app-4001 (round-robin)
    ├─→ app-4002 (round-robin)
    ↓
Shared Redis (port 6379, internal)
    ↓
Supabase Database (external)
```

### How Requests Flow

1. **Incoming Request** → User accesses `http://localhost:4000`
2. **Load Balancer** → nginx receives request, applies round-robin
3. **App Instance** → Request goes to app-4001 or app-4002
4. **Processing** → App handles request, may query Redis/Supabase
5. **Response** → Results sent back through nginx to user

### Health Monitoring

Every 30 seconds per container:
```
Docker → GET /api/health → App Instance
    ↓
    200 OK? → Container marked healthy
    ↓
    Not 200? → Increment failure counter
    ↓
    >3 failures? → Mark unhealthy, nginx reroutes traffic
```

### Graceful Shutdown

When restarting a container:
```
1. SIGTERM signal sent
2. process.on('SIGTERM') executes
3. isShuttingDown = true
4. Health checks return 503
5. nginx stops sending new requests
6. Existing requests complete (max 30s)
7. Container exits cleanly
8. Docker auto-restarts (unless-stopped)
```

---

## Quick Commands

### Get Started
```bash
docker-compose up -d                          # Start all services
docker-compose ps                              # Check status
curl http://localhost:4000/api/health         # Test public endpoint
```

### Monitor
```bash
docker-compose logs -f                        # View all logs
docker stats                                  # Resource usage
docker-compose ps                              # Health status
```

### Update App (Zero-Downtime)
```bash
git pull origin main
docker-compose build
docker-compose restart app-4001
sleep 10
docker-compose restart app-4002
```

### Check Reboots
```bash
docker-compose exec app-4001 cat /tmp/reboot-count.json
docker-compose logs app-4001 | grep WARNING
```

### Troubleshoot
```bash
docker-compose logs app-4001 app-4002      # App logs
docker-compose logs nginx                   # Load balancer logs
docker exec app-4001 sh                     # Shell into container
```

---

## Key Features

✅ **High Availability**
- 2 app instances (survive 1 failure)
- Automatic failover via nginx
- No single point of failure

✅ **Health Monitoring**
- Automatic container health checks every 30s
- Failed containers auto-rerouted by nginx
- Unhealthy containers auto-restarted

✅ **Graceful Shutdown**
- SIGTERM handler stops accepting new requests
- Existing requests drain (up to 30s)
- Zero-downtime updates

✅ **Reboot Tracking**
- Tracks reboots in `/tmp/reboot-count.json`
- Warns if >5 reboots in 1 hour
- Helps identify problematic containers

✅ **Load Balancing**
- Round-robin distribution
- Automatic failover if instance unhealthy
- Configurable upstream servers

✅ **Production Ready**
- WebSocket support
- Long-running request support (600s)
- Buffer management
- Proper header preservation

---

## Deployment Checklist

Before going to production:

- [ ] Read HA_QUICK_REFERENCE.md (5 min)
- [ ] Run quick start commands
- [ ] Run all tests in HA_TEST_GUIDE.md (20 min)
- [ ] Verify all tests pass
- [ ] Read HA_DEPLOYMENT.md (30 min)
- [ ] Load test with realistic traffic
- [ ] Set up monitoring/alerting
- [ ] Train ops team on procedures
- [ ] Deploy to production

---

## Common Questions

**Q: Why two app instances?**
A: Redundancy. If one fails, the other handles traffic. Zero downtime.

**Q: What if both fail?**
A: nginx returns 503. You'd need to fix the issue (logs, env vars, etc.) and restart.

**Q: Can I add a third instance?**
A: Yes! Duplicate app-4002 → app-4003 in docker-compose.yml and add to nginx.conf upstream.

**Q: Does this cost more?**
A: Yes, roughly 2x the container costs (2 app instances instead of 1). Redis/nginx overhead is negligible.

**Q: How do I update the app?**
A: `git pull`, `docker-compose build`, `docker-compose restart app-4001`, wait 10s, `docker-compose restart app-4002`.

**Q: What's the reboot warning about?**
A: If a container restarts >5 times in 1 hour, check logs for errors (memory leaks, crashes, dependency issues).

**Q: Why 30 second grace period?**
A: Typical long-running requests (video processing) should complete in <30s. Adjust in docker-compose.yml if needed.

---

## Support & Troubleshooting

### If something breaks:

1. **Check status**
   ```bash
   docker-compose ps  # All services healthy?
   ```

2. **Check logs**
   ```bash
   docker-compose logs -n 100 app-4001 app-4002 nginx
   ```

3. **Restart services**
   ```bash
   docker-compose restart app-4001 app-4002
   docker-compose ps  # Wait for "healthy" status
   ```

4. **Read guides**
   - Quick fix: See HA_QUICK_REFERENCE.md → Troubleshooting
   - Full guide: See HA_DEPLOYMENT.md → Troubleshooting

---

## File Structure

```
youtube-transcriber/
├── Dockerfile                           (Modified: +HEALTHCHECK)
├── docker-compose.yml                   (Modified: HA setup)
├── nginx.conf                           (New: load balancer config)
├── app/api/health/route.ts              (New: health endpoint)
│
├── HA_README.md                         (This file - navigation)
├── HA_QUICK_REFERENCE.md                (5 min read - start here)
├── HA_DEPLOYMENT.md                     (30 min read - full guide)
├── HA_TEST_GUIDE.md                     (20 min - testing procedures)
└── HA_IMPLEMENTATION_SUMMARY.md         (15 min - technical summary)
```

---

## Next Steps

### Immediately
1. Read HA_QUICK_REFERENCE.md
2. Run `docker-compose up -d`
3. Verify with `docker-compose ps`

### This Week
1. Run all tests from HA_TEST_GUIDE.md
2. Set up monitoring (DataDog, Prometheus, etc.)
3. Load test with realistic traffic

### Before Production
1. Train ops team using HA_DEPLOYMENT.md
2. Create runbooks for common operations
3. Schedule regular health drills
4. Deploy with zero-downtime procedure

---

## Key References

- **Architecture:** HA_IMPLEMENTATION_SUMMARY.md → Architecture Changes
- **Deployment:** HA_DEPLOYMENT.md → Deployment Steps
- **Testing:** HA_TEST_GUIDE.md → Test Scenarios
- **Monitoring:** HA_QUICK_REFERENCE.md → Monitoring Commands
- **Troubleshooting:** HA_DEPLOYMENT.md → Troubleshooting section

---

**Created:** 2024-06-13
**Last Updated:** 2024-06-13
**Status:** Ready for production testing

For questions or issues, refer to the appropriate guide above or check logs with `docker-compose logs -f`.
