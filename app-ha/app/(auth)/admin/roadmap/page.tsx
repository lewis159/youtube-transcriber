'use client'

type Status = 'completed' | 'in_progress' | 'pending' | 'future'
type Priority = 'critical' | 'high' | 'medium' | 'low' | 'nice_to_have'
type Category = 'security' | 'core' | 'prelaunch' | 'admin' | 'v2'

interface RoadmapItem {
  id: number
  title: string
  description: string
  status: Status
  priority: Priority
  category: Category
  updatedAt: string
}

const ROADMAP: RoadmapItem[] = [
  // Security — blocks production
  { id: 1,  title: 'Auth checks on all /api/admin/* routes',  description: 'All admin API routes are currently unprotected. Add global_admin role check to every endpoint before any data is exposed.',                                          status: 'completed', priority: 'critical',     category: 'security',  updatedAt: '2026-06-14' },
  { id: 2,  title: 'RLS policies in Supabase',                description: 'Migration 004 written — policies on all 8 tables. Users scoped to own rows. Orgs scoped to members. Audit log + overrides are service-role only.',       status: 'completed', priority: 'critical',     category: 'security',  updatedAt: '2026-06-14' },
  { id: 3,  title: 'Security headers in next.config.js',      description: 'Added CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy and YouTube image domain allowlist to next.config.js.',                                      status: 'completed', priority: 'critical',     category: 'security',  updatedAt: '2026-06-14' },
  { id: 4,  title: 'Scope deleteVideo() to userId',           description: 'deleteVideo() now filters by both videoId AND userId — a user can no longer delete another user\'s video.',                                                          status: 'completed', priority: 'critical',     category: 'security',  updatedAt: '2026-06-14' },
  // Core product
  { id: 5,  title: 'Core transcription loop',                 description: 'Fixed UUID mismatch (Clerk ID → Supabase UUID via getSupabaseUserId). Fixed url/youtubeUrl field mismatch. All DB ops now use service-role client.',      status: 'completed', priority: 'critical',     category: 'core',      updatedAt: '2026-06-14' },
  { id: 6,  title: 'Wire dashboard to real Supabase data',    description: 'Dashboard already calls /api/videos. Fixed by #5 UUID fix — listVideos now resolves Clerk ID to UUID before querying.',                                              status: 'completed', priority: 'high',         category: 'core',      updatedAt: '2026-06-14' },
  // Pre-launch
  { id: 7,  title: 'Stripe integration',                      description: 'Subscription checkout flow + Stripe webhook handler for tier upgrades (Explorer → Creator → Studio → Enterprise).',                                                   status: 'pending',  priority: 'high',         category: 'prelaunch', updatedAt: '2026-06-14' },
  { id: 8,  title: 'Feature flag enforcement in API routes',  description: 'Check feature flags on every gated endpoint. Return 403 + { error: "upgrade_required", feature } when tier doesn\'t have access.',                                   status: 'pending',  priority: 'high',         category: 'prelaunch', updatedAt: '2026-06-14' },
  { id: 9,  title: 'Apply Supabase migrations 002 + 003',     description: 'Migration 002 adds orgs, org_members, audit_log tables. Migration 003 adds role CHECK constraint. Neither has been applied to production.',                          status: 'pending',  priority: 'high',         category: 'prelaunch', updatedAt: '2026-06-14' },
  { id: 10, title: 'Domain + DNS + SSL (yt.bentech.dev)',      description: 'Point yt.bentech.dev at OVH server. Configure SSL certificates. Production domain confirmed.',                                                                       status: 'pending',  priority: 'high',         category: 'prelaunch', updatedAt: '2026-06-14' },
  { id: 11, title: 'Production deploy to Portainer',          description: 'Deploy to OVH physical server via Portainer. Switch from local Docker dev build to yt.bentech.dev.',                                                                 status: 'pending',  priority: 'high',         category: 'prelaunch', updatedAt: '2026-06-14' },
  { id: 15, title: 'Clerk webhook registration',              description: 'Register the Clerk webhook endpoint in the Clerk dashboard so user.created / user.updated events fire in production.',                                               status: 'pending',  priority: 'medium',       category: 'prelaunch', updatedAt: '2026-06-14' },
  // Admin portal
  { id: 12, title: 'Make admin alerts clickable',             description: 'Overview: CPU alert → /admin/containers, refund alert → /admin/billing, org alert → /admin/users, upgrade alert → /admin/users.',                                    status: 'pending',  priority: 'medium',       category: 'admin',     updatedAt: '2026-06-14' },
  { id: 13, title: 'Broadcast message modal',                 description: 'Quick action "Broadcast message" links to #. Build inline modal to compose and send a system announcement to all users.',                                             status: 'pending',  priority: 'medium',       category: 'admin',     updatedAt: '2026-06-14' },
  { id: 14, title: 'Drain container modal',                   description: 'Quick action "Drain container" should open an inline confirmation modal calling the Docker stop API rather than navigating away.',                                     status: 'pending',  priority: 'medium',       category: 'admin',     updatedAt: '2026-06-14' },
  // v2 / nice to have
  { id: 16, title: 'Monthly video credits + rollover',         description: 'Starter: 5 lifetime. Pro: 10/month with 1-month rollover. Studio: 40/month with 1-month rollover. Enterprise: custom. Credit deduction on transcribe.',            status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 17, title: 'Transcript search',                        description: 'Full-text search across transcript content. Available on all tiers. Requires video_transcript_text table and a search API route.',                                   status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 18, title: 'Share links feature',                      description: 'Pro: 10-day expiry links. Studio: 30-day expiry. Generate, revoke, and set download permissions per link.',                                                          status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 19, title: 'Scheduled transcription',                  description: 'Studio tier — queue a YouTube URL to be transcribed at a scheduled time or on a recurring basis.',                                                                   status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 20, title: 'Transcript correction',                    description: 'Studio tier — inline editing of transcript text with change history saved per segment.',                                                                              status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 21, title: 'Priority processing add-on',               description: 'Studio paid add-on. Transcription jobs jump the queue. Requires Redis BullMQ job queue with priority lanes.',                                                        status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 22, title: 'Audio / video export',                     description: 'Studio ZIP includes audio and video files alongside PDF. Requires storage integration and media processing pipeline.',                                                status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 23, title: 'Weekly Trivy security scanner',            description: 'Standalone Docker container. Runs Trivy against images + FS + Dockerfiles weekly. Scores findings and sends an email digest via Resend.',                          status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 24, title: 'Admin Security section — full build',      description: '/admin/security full implementation: live vulnerability feed, CVE enrichment, security score chart, and manual scanner trigger.',                                    status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
  { id: 25, title: 'Docker Swarm auto-scaling',                description: 'Dynamic container scaling based on queue depth and CPU load. Full architecture designed — awaiting answers to 7 open questions before build begins.',              status: 'future',   priority: 'nice_to_have', category: 'v2',        updatedAt: '2026-06-14' },
]

const STATUS_STYLE: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  completed:   { label: 'Completed',   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   dot: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  dot: '#f59e0b' },
  pending:     { label: 'Pending',     color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)',   dot: '#60a5fa' },
  future:      { label: 'Future',      color: '#555',    bg: 'rgba(255,255,255,0.02)', border: '#222',                   dot: '#444' },
}

const PRIORITY_STYLE: Record<Priority, { label: string; color: string; bg: string; border: string; leftBorder: string }> = {
  critical:     { label: 'Critical',     color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   leftBorder: '#ef4444' },
  high:         { label: 'High',         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  leftBorder: '#f59e0b' },
  medium:       { label: 'Medium',       color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)',   leftBorder: '#60a5fa' },
  low:          { label: 'Low',          color: '#888',    bg: 'rgba(255,255,255,0.04)', border: '#333',                   leftBorder: '#333' },
  nice_to_have: { label: 'Nice to Have', color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.2)', leftBorder: '#2a2a2a' },
}

const CATEGORIES: { key: Category; label: string; description: string }[] = [
  { key: 'security',  label: 'Security',        description: 'Must fix before any real users' },
  { key: 'core',      label: 'Core Product',    description: 'The app doesn\'t transcribe yet' },
  { key: 'prelaunch', label: 'Pre-Launch',       description: 'Required before going live' },
  { key: 'admin',     label: 'Admin Portal',     description: 'Polish & tooling improvements' },
  { key: 'v2',        label: 'Nice to Have',     description: 'Future features & v2 ideas' },
]

export default function RoadmapPage() {
  const completed   = ROADMAP.filter(i => i.status === 'completed').length
  const in_progress = ROADMAP.filter(i => i.status === 'in_progress').length
  const pending     = ROADMAP.filter(i => i.status === 'pending').length
  const future      = ROADMAP.filter(i => i.status === 'future').length
  const total       = ROADMAP.length

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* Sub-header bar */}
      <div style={{
        background: '#0d0d0d',
        borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '60px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Build Roadmap</span>
          <span style={{ fontSize: '11px', color: '#22c55e', fontFamily: 'monospace', background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
            {completed}/{total} done
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{today}</span>
      </div>

      <div style={{ padding: '24px' }}>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {([
            { label: 'Completed',   count: completed,   top: '#22c55e', sub: 'shipped',       subColor: '#22c55e' },
            { label: 'In Progress', count: in_progress, top: '#f59e0b', sub: 'active now',    subColor: '#f59e0b' },
            { label: 'Pending',     count: pending,     top: '#60a5fa', sub: 'queued',         subColor: '#888' },
            { label: 'Future / v2', count: future,      top: '#333',    sub: 'nice to have',   subColor: '#555' },
          ] as const).map(({ label, count, top, sub, subColor }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: `2px solid ${top}` }}>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{count}</div>
              <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Priority legend */}
        <div style={{
          background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginRight: '4px' }}>Priority</span>
          {(['critical', 'high', 'medium', 'low', 'nice_to_have'] as Priority[]).map(p => {
            const ps = PRIORITY_STYLE[p]
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: ps.leftBorder }} />
                <span style={{ fontSize: '12px', color: ps.color }}>{ps.label}</span>
              </div>
            )
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
            {(['completed', 'in_progress', 'pending', 'future'] as Status[]).map(s => {
              const ss = STATUS_STYLE[s]
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ss.dot }} />
                  <span style={{ fontSize: '11px', color: '#555' }}>{ss.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category sections */}
        {CATEGORIES.map(({ key, label, description }) => {
          const items = ROADMAP.filter(i => i.category === key)
          if (!items.length) return null
          return (
            <div key={key} style={{ marginBottom: '28px' }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: '#333', whiteSpace: 'nowrap' }}>— {description}</span>
                <div style={{ flex: 1, height: '0.5px', background: '#1e1e1e' }} />
                <span style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{items.length} items</span>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map(item => {
                  const ps = PRIORITY_STYLE[item.priority]
                  const ss = STATUS_STYLE[item.status]
                  const isComplete = item.status === 'completed'
                  return (
                    <div key={item.id} style={{
                      background: '#0d0d0d',
                      border: '0.5px solid #1e1e1e',
                      borderLeft: `3px solid ${ps.leftBorder}`,
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      opacity: isComplete ? 0.6 : 1,
                    }}>
                      {/* ID */}
                      <span style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', flexShrink: 0, marginTop: '2px', width: '28px' }}>
                        #{item.id}
                      </span>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '13px', fontWeight: 600,
                            color: isComplete ? '#555' : 'var(--text-primary)',
                            textDecoration: isComplete ? 'line-through' : 'none',
                          }}>
                            {item.title}
                          </span>
                          {/* Priority badge */}
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '3px',
                            color: ps.color, background: ps.bg, border: `0.5px solid ${ps.border}`,
                            flexShrink: 0,
                          }}>
                            {ps.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: '1.55' }}>
                          {item.description}
                        </p>
                      </div>

                      {/* Right side: status + date */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '3px',
                          color: ss.color, background: ss.bg, border: `0.5px solid ${ss.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {ss.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>{item.updatedAt}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: '11px', color: '#333', fontFamily: 'monospace', marginTop: '8px' }}>
          {ROADMAP.length} total items · last updated 2026-06-14 · global admin only
        </div>
      </div>
    </div>
  )
}
