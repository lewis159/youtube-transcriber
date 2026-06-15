'use client'

import { useState } from 'react'

const VERSIONS = [
  {
    id: 'v0.1.1',
    version: 'v0.1.1',
    label: 'Alpha',
    isCurrent: true,
    date: '15 June 2026',
    borderColor: '#E53935',
    newFeatures: [
      'Admin Security panel — live dashboard of all 28 security-review findings with severity, fix status, and priority action plan',
      'Container controls — start / stop / pause / restart containers from the admin panel, protected by a typed confirmation phrase',
      'Container monitor now filters to project containers only, with a "show all" toggle',
      'Delete video button on the dashboard with confirmation',
      'Google Analytics 4 integration (privacy-friendly, IP anonymised, env-var gated)',
      'global_admin role checks (requireAdmin) on all /api/admin/* routes',
    ],
    changes: [
      'Fixed admin overview page crash (server-component event-handler error) by extracting quick links into a client component',
      'Landing page is now fully static — removed the per-request auth call, so it loads instantly; sign-in/dashboard CTAs are now resolved client-side',
      'Knowledge base nav now shows a "Dashboard" link when signed in instead of always showing "Sign in"',
      'Feature flags tier table redesigned as cumulative tier cards (Starter → Pro → Studio → Enterprise) — no more wall of crosses',
      'Better upload error messages for private videos and videos without captions; failed videos now show an "error" status instead of being stuck on "processing"',
      'Video titles now fetched from YouTube on upload, with the video ID shown as a fallback',
    ],
  },
  {
    id: 'v0.1.0',
    version: 'v0.1.0',
    label: 'Alpha',
    isCurrent: false,
    date: '14 June 2026',
    borderColor: '#E53935',
    newFeatures: [
      'Full dark mode design system with CSS custom properties',
      'Landing page, dashboard, video detail, settings pages',
      'Feature flag architecture — all 4 tiers seeded',
      'Clerk v5.7.0 authentication',
      'Auth-aware landing page CTAs',
      '/api/ping fast health check endpoint',
      'Knowledge base foundation (22 articles)',
      'Admin panel overview dashboard',
    ],
    changes: [
      'Downgraded Next.js 16 → 15 for Clerk compatibility',
      'Fixed nginx Host/X-Forwarded-Host headers for Clerk handshake',
      'Docker health checks switched from curl to wget',
    ],
  },
  {
    id: 'v0.0.9',
    version: 'v0.0.9',
    label: 'Pre-alpha',
    isCurrent: false,
    date: 'January 2026',
    borderColor: '#333',
    newFeatures: [
      'Next.js rewrite from Flask',
      'HA Docker architecture (nginx cluster, app cluster, Redis Sentinel)',
      'Supabase schema',
      'docker-compose multi-stack setup',
    ],
    changes: [
      'Initial release — no prior version',
    ],
  },
]

const PER_PAGE = 2

const btnBase: React.CSSProperties = {
  padding: '7px 18px',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  background: 'transparent',
  border: '0.5px solid #2a2a2a',
  color: 'var(--text-secondary)',
  transition: 'all 0.15s',
}

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  opacity: 0.35,
  cursor: 'not-allowed',
}

export default function ChangelogPage() {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(VERSIONS.length / PER_PAGE)
  const paginatedVersions = VERSIONS.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Version History</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <button style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'pointer' }}>
          + Add version
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {paginatedVersions.map(v => (
            <div
              key={v.id}
              style={{
                background: '#0d0d0d',
                border: '0.5px solid #1e1e1e',
                borderRadius: '8px',
                borderLeft: `3px solid ${v.borderColor}`,
                padding: '24px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{v.version}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{v.label}</span>
                {v.isCurrent && (
                  <span style={{ fontSize: '11px', color: '#E53935', background: 'rgba(229,57,53,0.1)', border: '0.5px solid rgba(229,57,53,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>CURRENT</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '20px', fontFamily: 'monospace' }}>{v.date}</div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: v.isCurrent ? '#E53935' : '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>New Features</div>
                {v.newFeatures.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: v.isCurrent ? '#E53935' : '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Changes</div>
                {v.changes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={page === 1 ? btnDisabled : btnBase}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={page === totalPages ? btnDisabled : btnBase}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
