-- ============================================================
-- Migration 006: Changelog + Roadmap content tables
-- Moves the hardcoded VERSIONS and ROADMAP arrays out of the
-- admin pages and into the database, so they can be updated by a
-- plain DB write with no rebuild/redeploy.
--
-- RLS is ENABLED on both tables but NO public policies are added.
-- The admin pages read these tables server-side via the
-- service-role client (supabaseAdmin), which bypasses RLS, so no
-- anon/public policy is required.
-- ============================================================

-- ── changelog_entries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS changelog_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version      text NOT NULL,
  label        text,
  date         text,
  is_current   boolean NOT NULL DEFAULT false,
  border_color text,
  new_features text[] NOT NULL DEFAULT '{}',
  changes      text[] NOT NULL DEFAULT '{}',
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
-- No policies: read server-side via service-role client (bypasses RLS).

-- ── roadmap_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmap_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key    int NOT NULL,
  title       text NOT NULL,
  description text,
  status      text NOT NULL,
  priority    text NOT NULL,
  category    text NOT NULL,
  updated_at  text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
-- No policies: read server-side via service-role client (bypasses RLS).

-- ============================================================
-- Seed: changelog_entries (preserve display order via sort_order)
-- Only v0.1.1 is current.
-- ============================================================
INSERT INTO changelog_entries (version, label, date, is_current, border_color, new_features, changes, sort_order) VALUES
(
  'v0.1.1', 'Alpha', '15 June 2026', true, '#E53935',
  ARRAY[
    'Admin Security panel — live dashboard of all 28 security-review findings with severity, fix status, and priority action plan',
    'Container controls — start / stop / pause / restart containers from the admin panel, protected by a typed confirmation phrase',
    'Container monitor now filters to project containers only, with a "show all" toggle',
    'Delete video button on the dashboard with confirmation',
    'Google Analytics 4 integration (privacy-friendly, IP anonymised, env-var gated)',
    'global_admin role checks (requireAdmin) on all /api/admin/* routes'
  ],
  ARRAY[
    'Fixed admin overview page crash (server-component event-handler error) by extracting quick links into a client component',
    'Landing page is now fully static — removed the per-request auth call, so it loads instantly; sign-in/dashboard CTAs are now resolved client-side',
    'Knowledge base nav now shows a "Dashboard" link when signed in instead of always showing "Sign in"',
    'Feature flags tier table redesigned as cumulative tier cards (Starter → Pro → Studio → Enterprise) — no more wall of crosses',
    'Better upload error messages for private videos and videos without captions; failed videos now show an "error" status instead of being stuck on "processing"',
    'Video titles now fetched from YouTube on upload, with the video ID shown as a fallback'
  ],
  0
),
(
  'v0.1.0', 'Alpha', '14 June 2026', false, '#E53935',
  ARRAY[
    'Full dark mode design system with CSS custom properties',
    'Landing page, dashboard, video detail, settings pages',
    'Feature flag architecture — all 4 tiers seeded',
    'Clerk v5.7.0 authentication',
    'Auth-aware landing page CTAs',
    '/api/ping fast health check endpoint',
    'Knowledge base foundation (22 articles)',
    'Admin panel overview dashboard'
  ],
  ARRAY[
    'Downgraded Next.js 16 → 15 for Clerk compatibility',
    'Fixed nginx Host/X-Forwarded-Host headers for Clerk handshake',
    'Docker health checks switched from curl to wget'
  ],
  1
),
(
  'v0.0.9', 'Pre-alpha', 'January 2026', false, '#333',
  ARRAY[
    'Next.js rewrite from Flask',
    'HA Docker architecture (nginx cluster, app cluster, Redis Sentinel)',
    'Supabase schema',
    'docker-compose multi-stack setup'
  ],
  ARRAY[
    'Initial release — no prior version'
  ],
  2
);

-- ============================================================
-- Seed: roadmap_items (sort_order matches current display order)
-- ============================================================
INSERT INTO roadmap_items (item_key, title, description, status, priority, category, updated_at, sort_order) VALUES
(1,  'Auth checks on all /api/admin/* routes', 'All admin API routes are currently unprotected. Add global_admin role check to every endpoint before any data is exposed.', 'completed', 'critical', 'security', '2026-06-14', 0),
(2,  'RLS policies in Supabase', 'Migration 004 written — policies on all 8 tables. Users scoped to own rows. Orgs scoped to members. Audit log + overrides are service-role only.', 'completed', 'critical', 'security', '2026-06-14', 1),
(3,  'Security headers in next.config.js', 'Added CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy and YouTube image domain allowlist to next.config.js.', 'completed', 'critical', 'security', '2026-06-14', 2),
(4,  'Scope deleteVideo() to userId', 'deleteVideo() now filters by both videoId AND userId — a user can no longer delete another user''s video.', 'completed', 'critical', 'security', '2026-06-14', 3),
(5,  'Core transcription loop', 'Fixed UUID mismatch (Clerk ID → Supabase UUID via getSupabaseUserId). Fixed url/youtubeUrl field mismatch. All DB ops now use service-role client.', 'completed', 'critical', 'core', '2026-06-14', 4),
(6,  'Wire dashboard to real Supabase data', 'Dashboard already calls /api/videos. Fixed by #5 UUID fix — listVideos now resolves Clerk ID to UUID before querying.', 'completed', 'high', 'core', '2026-06-14', 5),
(7,  'Stripe integration', 'Subscription checkout flow + Stripe webhook handler for tier upgrades (Starter → Pro → Studio → Enterprise).', 'pending', 'high', 'prelaunch', '2026-06-14', 6),
(8,  'Feature flag enforcement in API routes', 'Check feature flags on every gated endpoint. Return 403 + { error: "upgrade_required", feature } when tier doesn''t have access.', 'pending', 'high', 'prelaunch', '2026-06-14', 7),
(9,  'Apply Supabase migrations 002 + 003', 'Migration 002 adds orgs, org_members, audit_log tables. Migration 003 adds role CHECK constraint. Neither has been applied to production.', 'pending', 'high', 'prelaunch', '2026-06-14', 8),
(10, 'Domain + DNS + SSL (yt.bentech.dev)', 'Point yt.bentech.dev at OVH server. Configure SSL certificates. Production domain confirmed.', 'pending', 'high', 'prelaunch', '2026-06-14', 9),
(11, 'Production deploy to Portainer', 'Deploy to OVH physical server via Portainer. Switch from local Docker dev build to yt.bentech.dev.', 'pending', 'high', 'prelaunch', '2026-06-14', 10),
(15, 'Clerk webhook registration', 'Register the Clerk webhook endpoint in the Clerk dashboard so user.created / user.updated events fire in production.', 'pending', 'medium', 'prelaunch', '2026-06-14', 11),
(12, 'Make admin alerts clickable', 'Overview: CPU alert → /admin/containers, refund alert → /admin/billing, org alert → /admin/users, upgrade alert → /admin/users.', 'pending', 'medium', 'admin', '2026-06-14', 12),
(13, 'Broadcast message modal', 'Quick action "Broadcast message" links to #. Build inline modal to compose and send a system announcement to all users.', 'pending', 'medium', 'admin', '2026-06-14', 13),
(14, 'Drain container modal', 'Quick action "Drain container" should open an inline confirmation modal calling the Docker stop API rather than navigating away.', 'pending', 'medium', 'admin', '2026-06-14', 14),
(16, 'Monthly video credits + rollover', 'Starter: 5 lifetime. Pro: 10/month with 1-month rollover. Studio: 40/month with 1-month rollover. Enterprise: custom. Credit deduction on transcribe.', 'future', 'nice_to_have', 'v2', '2026-06-14', 15),
(17, 'Transcript search', 'Full-text search across transcript content. Available on all tiers. Requires video_transcript_text table and a search API route.', 'future', 'nice_to_have', 'v2', '2026-06-14', 16),
(18, 'Share links feature', 'Pro: 10-day expiry links. Studio: 30-day expiry. Generate, revoke, and set download permissions per link.', 'future', 'nice_to_have', 'v2', '2026-06-14', 17),
(19, 'Scheduled transcription', 'Studio tier — queue a YouTube URL to be transcribed at a scheduled time or on a recurring basis.', 'future', 'nice_to_have', 'v2', '2026-06-14', 18),
(20, 'Transcript correction', 'Studio tier — inline editing of transcript text with change history saved per segment.', 'future', 'nice_to_have', 'v2', '2026-06-14', 19),
(21, 'Priority processing add-on', 'Studio paid add-on. Transcription jobs jump the queue. Requires Redis BullMQ job queue with priority lanes.', 'future', 'nice_to_have', 'v2', '2026-06-14', 20),
(22, 'Audio / video export', 'Studio ZIP includes audio and video files alongside PDF. Requires storage integration and media processing pipeline.', 'future', 'nice_to_have', 'v2', '2026-06-14', 21),
(23, 'Weekly Trivy security scanner', 'Standalone Docker container. Runs Trivy against images + FS + Dockerfiles weekly. Scores findings and sends an email digest via Resend.', 'future', 'nice_to_have', 'v2', '2026-06-14', 22),
(24, 'Admin Security section — full build', '/admin/security full implementation: live vulnerability feed, CVE enrichment, security score chart, and manual scanner trigger.', 'future', 'nice_to_have', 'v2', '2026-06-14', 23),
(25, 'Docker Swarm auto-scaling', 'Dynamic container scaling based on queue depth and CPU load. Full architecture designed — awaiting answers to 7 open questions before build begins.', 'future', 'nice_to_have', 'v2', '2026-06-14', 24),
(26, 'Container start/stop/pause controls', 'Admin panel can control project containers (start/stop/pause) with a typed confirmation phrase before destructive actions execute.', 'completed', 'medium', 'admin', '2026-06-15', 25),
(27, 'Admin Security findings panel', '/admin/security dashboard surfacing all 28 security review findings with live fix status, severity breakdown, and a priority action plan.', 'completed', 'medium', 'admin', '2026-06-15', 26),
(28, 'Google Analytics 4', 'gtag.js integrated via NEXT_PUBLIC_GA_ID with IP anonymisation, gated behind the env var so it only loads when configured.', 'in_progress', 'medium', 'prelaunch', '2026-06-15', 27),
(29, 'v3 — Standalone support portal', 'Extract support tooling (user mgmt, support notes, billing actions, read-only impersonation) into its own Next.js app with shared global_admin auth. Do not start until v2 ships.', 'future', 'nice_to_have', 'v2', '2026-06-15', 28);
