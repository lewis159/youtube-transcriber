# Redis HA Topology — Operator Notes

Sentinel-managed Redis primary/standby for the YT Transcriber prod stack.
Canonical definition: **`docker-compose.prod.yml`** (services on the `yt-prod`
overlay). Standalone test/reference variant: **`docker-compose.redis.yml`**.

## Topology

| Service          | Role                  | Port  | Notes                                            |
|------------------|-----------------------|-------|--------------------------------------------------|
| `redis-primary`  | Master                | 6379  | AOF (`everysec`), `noeviction`, password auth.   |
| `redis-standby`  | Replica of primary    | 6379  | `--replicaof redis-primary 6379`; promotable.    |
| `redis-failover` | Sentinel (`mode: global`) | 26379 | Monitors `mymaster`, quorum 2. One per node. |

- **Master name:** `mymaster`  •  **Quorum:** `2`
- **Client URL (app + worker):**
  `REDIS_URL=sentinel://redis-failover:26379/0?sentinelName=mymaster`
  plus `REDIS_PASSWORD`. Clients ask Sentinel for the current master, so a
  promoted standby is picked up without changing the URL.

## `REDIS_PASSWORD` — required stack env

One password is used **everywhere**:
- Redis nodes: `--requirepass` **and** `--masterauth` (so a promoted replica can
  still authenticate to whichever node becomes master).
- Sentinels: `requirepass` **and** `sentinel auth-pass mymaster`.

Supply it via the **Portainer stack environment** as `REDIS_PASSWORD` (referenced
as `${REDIS_PASSWORD}` throughout the compose files). For the standalone stack,
export it in the deploying shell:

```bash
REDIS_PASSWORD='<strong-secret>' docker stack deploy -c docker-compose.redis.yml redis-ha
```

If `REDIS_PASSWORD` is unset the nodes come up with an empty password and
Sentinel auth will mismatch — always set it.

## Placement: single-host interim vs. 2-host anti-affinity

The stack uses **soft placement preferences** (`spread: node.id`), NOT hard
constraints. This is deliberate:

- **Today (1 node):** primary, standby, and Sentinel all schedule on the single
  node. The stack runs and is functional, **but it is NOT fault-tolerant** — if
  that one host dies, both Redis copies and the only Sentinel go with it. This is
  an accepted interim state until host #2 joins.
- **When host #2 joins:** soft spread naturally pushes primary and standby onto
  different nodes, and `mode: global` gives you a second Sentinel (quorum 2 then
  has 2 voters). No file change needed for the spread to take effect.

### Node-label hardening — guaranteed anti-affinity on 2 hosts

Soft preferences are best-effort; the scheduler *may* still co-locate under
pressure. For **guaranteed** primary/standby separation once you have 2 hosts:

1. Label the nodes:
   ```bash
   docker node update --label-add redis=primary <nodeA>
   docker node update --label-add redis=standby <nodeB>
   ```
2. In `docker-compose.prod.yml`, replace the soft preference on each Redis
   service with a hard constraint:
   ```yaml
   # redis-primary
   placement:
     constraints:
       - node.labels.redis == primary
   # redis-standby
   placement:
     constraints:
       - node.labels.redis == standby
   ```
3. Re-deploy the stack. Now the master and replica can never land on the same
   host. Leave `redis-failover` as `mode: global` (one Sentinel per node).

> Trade-off: hard constraints mean a service stays **Pending** if its labelled
> node is unavailable. Only apply them once you genuinely have 2 nodes; on a
> single node a constraint to a missing label would block scheduling entirely.

## Sentinel on Swarm — announce-ip caveat (VALIDATE)

Sentinel does not play perfectly with Swarm's VIP networking, so the config is
generated **per instance at container start** (Sentinel rewrites its own config
at runtime, so a shared bind-mounted file would corrupt across replicas):

```
sentinel resolve-hostnames yes            # monitor the redis-primary SERVICE NAME
sentinel announce-ip "$(hostname -i | awk '{print $1}')"   # advertise own overlay IP
```

- `resolve-hostnames yes` lets Sentinel monitor `redis-primary` by name instead
  of needing a fixed IP.
- `announce-ip` makes each Sentinel advertise its own container overlay IP to its
  peers (otherwise Sentinels behind a Swarm VIP can mis-report each other).

**⚠️ This announce-ip approach MUST be confirmed with a real failover drill on a
multi-node Swarm before it is trusted in production.** Known risk areas:
- A replica's reported IP/port must be reachable from clients and other Sentinels.
- After promotion, clients must be steered to the new master via Sentinel.
- `hostname -i` returns the first overlay IP — verify it's the `yt-prod`/`redis-ha`
  overlay IP and not an unexpected interface on multi-network containers.

## Failover drill — verification steps

Run on the Swarm (adjust stack name; examples use the prod stack `yt`):

1. **Sentinel sees the master + a replica:**
   ```bash
   docker exec -it $(docker ps -qf name=redis-failover) \
     redis-cli -p 26379 -a "$REDIS_PASSWORD" sentinel master mymaster
   docker exec -it $(docker ps -qf name=redis-failover) \
     redis-cli -p 26379 -a "$REDIS_PASSWORD" sentinel replicas mymaster
   ```
   Expect `num-slaves` ≥ 1 and `flags=master` (no `s_down`/`o_down`).

2. **Write to master, confirm replication to standby:**
   ```bash
   docker exec -it $(docker ps -qf name=redis-primary) \
     redis-cli -a "$REDIS_PASSWORD" set ha:probe ok
   docker exec -it $(docker ps -qf name=redis-standby) \
     redis-cli -a "$REDIS_PASSWORD" get ha:probe   # => "ok"
   ```

3. **Trigger failover** (kill the primary or force it):
   ```bash
   # Forced failover:
   docker exec -it $(docker ps -qf name=redis-failover) \
     redis-cli -p 26379 -a "$REDIS_PASSWORD" sentinel failover mymaster
   # …or hard-kill: docker rm -f <redis-primary container>
   ```

4. **Confirm promotion** — within ~5–10s the standby becomes master:
   ```bash
   docker exec -it $(docker ps -qf name=redis-failover) \
     redis-cli -p 26379 -a "$REDIS_PASSWORD" sentinel get-master-addr-by-name mymaster
   ```
   The returned IP should now be the (former) standby.

5. **Confirm clients recover:** app and `whisper-worker` re-discover the new
   master. Note: the **Python BullMQ worker does not follow a master that moves
   at runtime** — its connection breaks, the process exits, and Swarm
   (`restart_policy: on-failure`) restarts it so it re-discovers the master at
   boot. Verify the worker task restarts and resumes pulling jobs.

6. **Confirm the old primary rejoins as a replica** when it comes back (Swarm
   restarts it; Sentinel reconfigures it as a replica of the new master).
