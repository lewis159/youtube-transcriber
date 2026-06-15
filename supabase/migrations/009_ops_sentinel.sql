-- 009_ops_sentinel.sql
-- Operations & Security Console ("Sentinel") — Phase 0 foundation schema.
--
-- Everything lives in a DEDICATED `ops` Postgres schema so the entire console
-- can be lifted into its own service/database later by moving one schema —
-- nothing is entangled with the app's `public` tables (the only outward
-- reference is to public.users, and that is nullable + ON DELETE SET NULL).
--
-- Graph-first: a single polymorphic `ops.links` table is the connective tissue
-- (finding→ticket, kb→ticket, finding→component, component→container).
-- Machine truth vs human workflow: `ops.findings` is the source of record
-- (re-detected, auto-managed); `ops.tickets` is the human wrapper. They are
-- LINKED, never merged, with a dedup fingerprint so re-scans update not duplicate.
--
-- RLS is enabled with no public policy: read/write via the service-role client
-- only. NOTE: to query this schema from supabase-js, either use
--   supabaseAdmin.schema('ops').from('findings')
-- or add `ops` to the project's Exposed Schemas (Settings → API → Exposed schemas).

-- ---------------------------------------------------------------------------
-- Dedicated schema
-- ---------------------------------------------------------------------------
create schema if not exists ops;

-- Shared updated_at trigger helper
create or replace function ops.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Human-readable reference sequences (SEC-0001, OPS-0001)
create sequence if not exists ops.finding_seq start 1;
create sequence if not exists ops.ticket_seq  start 1;

-- ===========================================================================
-- COMPONENTS — inventory of services/routes/infra (app, nginx, api/admin, …).
-- ===========================================================================
create table if not exists ops.components (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,                 -- 'app', 'nginx', 'api/admin'
  name        text not null,
  kind        text not null default 'service',      -- service | route | infra | external
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- FINDINGS — machine-detected issues. Source of truth, re-detected on re-scan.
-- ===========================================================================
create table if not exists ops.findings (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique,                       -- 'SEC-0009' (set by trigger)
  -- Dedup fingerprint: stable hash of (source + rule + component + identity).
  -- A re-scan producing the same fingerprint UPDATES this row (bumps
  -- last_seen_at) instead of inserting a duplicate.
  fingerprint     text unique not null,
  title           text not null,
  description     text,
  severity        text not null default 'medium',    -- critical|high|medium|low|info
  cvss            numeric(3,1),
  cwe             text,
  component_id    uuid references ops.components(id) on delete set null,
  component_label text,                              -- denormalised for display
  source          text not null default 'manual',    -- npm-audit|gitleaks|trivy|abuse|webhook|manual
  status          text not null default 'open',       -- open|triaged|in_progress|fixed|acknowledged|wont_fix|reappeared
  evidence        jsonb not null default '{}',
  remediation     jsonb not null default '{}',
  -- auto_managed findings are opened/closed by their scanner; override_locked
  -- means a human set the status and the scanner must NOT auto-change it.
  auto_managed    boolean not null default true,
  override_locked boolean not null default false,
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  resolved_at     timestamptz,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function ops.set_finding_ref()
returns trigger language plpgsql as $$
begin
  if new.ref is null then
    new.ref := 'SEC-' || lpad(nextval('ops.finding_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_finding_ref on ops.findings;
create trigger trg_finding_ref before insert on ops.findings
  for each row execute function ops.set_finding_ref();
drop trigger if exists trg_finding_updated on ops.findings;
create trigger trg_finding_updated before update on ops.findings
  for each row execute function ops.set_updated_at();

create index if not exists findings_status_idx   on ops.findings (status, severity);
create index if not exists findings_component_idx on ops.findings (component_id);
create index if not exists findings_source_idx    on ops.findings (source, last_seen_at desc);

-- ===========================================================================
-- TICKETS — human work-item wrapper. Shared primitive: the future support
-- portal (#29) sits on this same table (type = 'support').
-- ===========================================================================
create table if not exists ops.tickets (
  id               uuid primary key default gen_random_uuid(),
  ref              text unique,                      -- 'OPS-0001' (set by trigger)
  title            text not null,
  description      text,
  type             text not null default 'task',     -- security|abuse|infra|support|task
  status           text not null default 'open',     -- open|in_progress|blocked|resolved|closed
  priority         text not null default 'medium',   -- critical|high|medium|low
  assignee_user_id uuid references public.users(id) on delete set null,
  reporter_user_id uuid references public.users(id) on delete set null,
  source           text not null default 'manual',   -- finding|alert|manual|customer
  sla_due_at       timestamptz,
  opened_at        timestamptz not null default now(),
  resolved_at      timestamptz,
  closed_at        timestamptz,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace function ops.set_ticket_ref()
returns trigger language plpgsql as $$
begin
  if new.ref is null then
    new.ref := 'OPS-' || lpad(nextval('ops.ticket_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ticket_ref on ops.tickets;
create trigger trg_ticket_ref before insert on ops.tickets
  for each row execute function ops.set_ticket_ref();
drop trigger if exists trg_ticket_updated on ops.tickets;
create trigger trg_ticket_updated before update on ops.tickets
  for each row execute function ops.set_updated_at();

create index if not exists tickets_status_idx   on ops.tickets (status, priority);
create index if not exists tickets_assignee_idx on ops.tickets (assignee_user_id);
create index if not exists tickets_type_idx      on ops.tickets (type, status);

-- ===========================================================================
-- COMMENTS / activity stream on tickets.
-- ===========================================================================
create table if not exists ops.comments (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references ops.tickets(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  body           text,
  kind           text not null default 'comment',   -- comment|status_change|system
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);
create index if not exists comments_ticket_idx on ops.comments (ticket_id, created_at);

-- ===========================================================================
-- LINKS — polymorphic graph edges that connect everything. Text ids so an edge
-- can reference uuid rows (findings/tickets) AND non-uuid entities (kb slugs,
-- container names, component keys).
--   ('finding', <id>, 'ticket', <id>, 'raises')
--   ('kb', 'stripe-billing', 'ticket', <id>, 'documents')
--   ('finding', <id>, 'component', 'app', 'about')
-- ===========================================================================
create table if not exists ops.links (
  id        uuid primary key default gen_random_uuid(),
  src_type  text not null,
  src_id    text not null,
  dst_type  text not null,
  dst_id    text not null,
  relation  text not null,                            -- raises|documents|about|runs_on|duplicates
  metadata  jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (src_type, src_id, dst_type, dst_id, relation)
);
create index if not exists links_src_idx on ops.links (src_type, src_id);
create index if not exists links_dst_idx on ops.links (dst_type, dst_id);

-- ===========================================================================
-- CONTAINER SNAPSHOTS — periodic capacity metrics (Phase 1 fills via socket-proxy).
-- ===========================================================================
create table if not exists ops.container_snapshots (
  id              uuid primary key default gen_random_uuid(),
  component_id    uuid references ops.components(id) on delete set null,
  container_name  text not null,
  state           text,
  cpu_pct         numeric(5,2),
  mem_bytes       bigint,
  mem_limit_bytes bigint,
  restarts        int,
  taken_at        timestamptz not null default now(),
  raw             jsonb not null default '{}'
);
create index if not exists snapshots_name_time_idx on ops.container_snapshots (container_name, taken_at desc);

-- ===========================================================================
-- RULES / ALERTS — when-this-then-that engine (Phase 1; modelled now).
-- ===========================================================================
create table if not exists ops.rules (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  enabled    boolean not null default true,
  trigger    jsonb not null default '{}',
  action     jsonb not null default '{}',
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_rule_updated on ops.rules;
create trigger trg_rule_updated before update on ops.rules
  for each row execute function ops.set_updated_at();

create table if not exists ops.alerts (
  id          uuid primary key default gen_random_uuid(),
  rule_id     uuid references ops.rules(id) on delete set null,
  severity    text not null default 'medium',
  message     text not null,
  dedup_key   text,
  status      text not null default 'firing',         -- firing|acknowledged|resolved
  fired_at    timestamptz not null default now(),
  resolved_at timestamptz,
  metadata    jsonb not null default '{}'
);
create index if not exists alerts_dedup_idx on ops.alerts (dedup_key, status);

-- ---------------------------------------------------------------------------
-- Grants + RLS. Service-role bypasses RLS; we still enable it so nothing is
-- ever exposed via the anon/auth roles by accident.
-- ---------------------------------------------------------------------------
grant usage on schema ops to service_role;
grant all on all tables in schema ops to service_role;
grant all on all sequences in schema ops to service_role;
alter default privileges in schema ops grant all on tables to service_role;
alter default privileges in schema ops grant all on sequences to service_role;

alter table ops.components          enable row level security;
alter table ops.findings            enable row level security;
alter table ops.tickets             enable row level security;
alter table ops.comments            enable row level security;
alter table ops.links               enable row level security;
alter table ops.container_snapshots enable row level security;
alter table ops.rules               enable row level security;
alter table ops.alerts              enable row level security;
