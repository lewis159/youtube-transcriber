export interface ChangelogEntry {
  version: string
  label: string
  date: string
  current: boolean
  features: string[]
  changes: string[]
  fixes?: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    label: 'Alpha',
    date: '14 June 2026',
    current: true,
    features: [
      'Full dark mode design system with CSS custom properties',
      'Landing page, dashboard, video detail, and settings pages',
      'Feature flag architecture — all 4 tiers seeded in Supabase',
      'Clerk v5.7.0 authentication with middleware protection',
      'Auth-aware landing page CTAs (signed-in users see Go to Dashboard)',
      '/api/ping fast health check endpoint',
      'Knowledge base — 22 articles across user, admin, and architecture tiers',
      'Admin panel — overview, users, organisations, billing, feature flags, audit log, containers, changelog',
      'Docker socket monitoring API (/api/admin/containers)',
      'Supabase schema v2 — global admin role, trial user status, organisations, audit log',
    ],
    changes: [
      'Downgraded Next.js 16 → 15.5.19 for Clerk v5 compatibility',
      'Renamed proxy.ts → middleware.ts (Next.js 15 convention)',
      'Docker health checks switched from curl to wget (alpine)',
      'Clerk webhook: user.created uses INSERT not upsert; user.updated never overwrites tier or role',
    ],
    fixes: [],
  },
  {
    version: '0.0.9',
    label: 'Pre-alpha',
    date: 'January 2026',
    current: false,
    features: [
      'Next.js rewrite from Flask — full TypeScript App Router codebase',
      'High-availability Docker architecture: nginx cluster, 2-node app cluster, Redis Sentinel',
      'Supabase schema v1 — users, videos, transcripts, notes, folders, share_links, tier_features',
      'docker-compose multi-stack setup (infrastructure, app, nginx, redis)',
    ],
    changes: [
      'Initial release — no prior version',
    ],
    fixes: [],
  },
]
