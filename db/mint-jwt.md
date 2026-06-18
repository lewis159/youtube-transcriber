# Minting the `anon` and `service_role` JWTs

PostgREST authenticates requests with an **HS256 JWT** signed by the same
`PGRST_JWT_SECRET` configured on the `postgrest` service. The JWT's `.role`
claim (because `PGRST_JWT_ROLE_CLAIM_KEY=.role`) tells PostgREST which Postgres
role to `SET ROLE` to. We mint two long-lived tokens — they become the app's
"keys":

| App env var (the 3-var cutover)         | JWT `role` claim | Postgres role used     |
| --------------------------------------- | ---------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | `anon`           | `anon`                 |
| `SUPABASE_SERVICE_ROLE_KEY`             | `service_role`   | `service_role` (BYPASSRLS) |

Claims (match Supabase's own GoTrue-issued keys so supabase-js is happy):

```json
{ "role": "anon",         "iss": "supabase" }
{ "role": "service_role", "iss": "supabase" }
```

> These are unexpiring by default (no `exp`). If you add `exp`, you must rotate
> the app env vars before they expire. For an internal self-hosted DB, omitting
> `exp` matches Supabase's default anon/service keys.

The signing secret **must** be the exact value of `PGRST_JWT_SECRET` from the
stack env (min 32 chars). Treat the minted `service_role` token like a root
password — it BYPASSRLS.

---

## Option A — Node one-liner (no install if `jsonwebtoken` is present)

`jsonwebtoken` is already in the app's dependency tree. From the repo root:

```bash
export PGRST_JWT_SECRET='<the exact stack PGRST_JWT_SECRET>'

# anon key  -> NEXT_PUBLIC_SUPABASE_ANON_KEY
node -e "console.log(require('jsonwebtoken').sign({role:'anon',iss:'supabase'}, process.env.PGRST_JWT_SECRET, {algorithm:'HS256'}))"

# service_role key -> SUPABASE_SERVICE_ROLE_KEY
node -e "console.log(require('jsonwebtoken').sign({role:'service_role',iss:'supabase'}, process.env.PGRST_JWT_SECRET, {algorithm:'HS256'}))"
```

If `jsonwebtoken` is not resolvable in that context: `npm i -g jsonwebtoken`
then prefix the commands with `NODE_PATH="$(npm root -g)"`.

## Option B — Python one-liner (`pip install pyjwt`)

```bash
export PGRST_JWT_SECRET='<the exact stack PGRST_JWT_SECRET>'

python -c "import jwt,os;print(jwt.encode({'role':'anon','iss':'supabase'},os.environ['PGRST_JWT_SECRET'],algorithm='HS256'))"
python -c "import jwt,os;print(jwt.encode({'role':'service_role','iss':'supabase'},os.environ['PGRST_JWT_SECRET'],algorithm='HS256'))"
```

(On PyJWT >= 2, `jwt.encode` returns a `str` directly.)

---

## Verify a minted token

Decode without verifying (sanity-check the claims):

```bash
node -e "console.log(require('jsonwebtoken').decode(process.argv[1]))" "<paste-token>"
```

End-to-end check against a running PostgREST (`:3001`):

```bash
# anon request (should succeed for anon-readable tables / fail RLS otherwise)
curl -s http://localhost:3001/tier_features \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" | head

# service_role request (BYPASSRLS — should return rows)
curl -s "http://localhost:3001/users?select=id&limit=1" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
```

> supabase-js sends BOTH the `apikey` header AND `Authorization: Bearer <key>`.
> PostgREST only reads `Authorization: Bearer`; it ignores `apikey`. That's fine
> — the Bearer token is what carries the `.role` claim. No PostgREST config
> needed for the `apikey` header.
