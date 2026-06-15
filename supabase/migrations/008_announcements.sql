-- 008_announcements.sql
-- Site-wide admin announcements (broadcast messages).

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  level      text not null default 'info',   -- 'info' | 'warning' | 'critical'
  active     boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Fast lookup of the current active announcement (newest first).
create index if not exists announcements_active_idx
  on public.announcements (active, created_at desc);

-- RLS enabled, no public policy: read/write via the service-role client only.
alter table public.announcements enable row level security;
