# 99 — Rollback (Runbook Step 7 reversed / "instant rollback")

> **This is a documentation step, not a script.** Rollback is an
> **environment-variable change on the app** — there is nothing to run against
> the database. Keeping it as a doc avoids any tool that could accidentally
> write to a DB.

The cutover (Step 7) is env-only, so rollback is too. Set the **same 3 vars
back to the cloud values** on the app stack (and the whisper-worker if it reads
them) and redeploy:

```
NEXT_PUBLIC_SUPABASE_URL=https://<cloud-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<original cloud anon key>
SUPABASE_SERVICE_ROLE_KEY=<original cloud service key>
```

> Use the real cloud project values you saved before cutover. Do not hardcode a
> project ref you are unsure of — copy from your secret store / Supabase
> dashboard. `NEXT_PUBLIC_SUPABASE_URL` must not contain the string
> `placeholder` (the app treats that as "not configured").

Example (Docker Swarm):

```bash
docker service update \
  --env-add NEXT_PUBLIC_SUPABASE_URL=https://<cloud-project-ref>.supabase.co \
  --env-add NEXT_PUBLIC_SUPABASE_ANON_KEY=<original cloud anon key> \
  --env-add SUPABASE_SERVICE_ROLE_KEY=<original cloud service key> \
  yt-prod_app
```

## Important caveat (from the runbook)

Because the cloud project stays **live and unmodified** during the soak
(~2 weeks), this is a **zero-data-loss** rollback for anything written **before**
cutover.

**Data written to the self-hosted DB during the soak is NOT mirrored back to
cloud.** If you roll back after writes have landed locally, those rows must be
re-exported from the self-hosted DB and loaded into cloud — i.e. the reverse of
Steps 4–5:

1. `pg_dump --data-only` from the **self-hosted** DB (now the source).
2. Restore into the **cloud** project (now the target), honouring the same
   `tier_features` collision note if applicable.

Keep the soak window short and watch the Step 8 smoke checklist closely right
after cutover so a rollback, if needed, happens before local-only writes
accumulate.
