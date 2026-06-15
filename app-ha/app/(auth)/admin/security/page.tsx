const findings = [
  { id: 1,  severity: 'CRITICAL', area: 'Auth / Admin API',     issue: 'No auth or role checks on /api/admin/* routes',                         fixed: false },
  { id: 2,  severity: 'CRITICAL', area: 'Auth / Admin Pages',   issue: 'Admin pages only check userId, not global_admin role',                   fixed: false },
  { id: 9,  severity: 'CRITICAL', area: 'Docker',               issue: 'Docker socket mounted in root-running app containers',                    fixed: false },
  { id: 14, severity: 'CRITICAL', area: 'Database',             issue: 'RLS enabled but zero policies — anon key blocked',                        fixed: false },
  { id: 24, severity: 'CRITICAL', area: 'Test Runner',          issue: 'Test runner accessible with no auth on Docker network',                   fixed: false },
  { id: 3,  severity: 'HIGH',     area: 'Auth Layout',          issue: 'Auth layout is client component — no server role check',                  fixed: false },
  { id: 4,  severity: 'HIGH',     area: 'Auth / KB',            issue: 'Admin KB articles gated on userId only, not global_admin',                fixed: false },
  { id: 5,  severity: 'HIGH',     area: 'API',                  issue: 'No rate limiting in Nginx or Next.js',                                    fixed: false },
  { id: 6,  severity: 'HIGH',     area: 'Headers',              issue: 'No CSP, X-Frame-Options, HSTS, or CORS policy',                           fixed: false },
  { id: 10, severity: 'HIGH',     area: 'Docker',               issue: 'App containers exposed directly on host ports 4002/4003',                 fixed: false },
  { id: 11, severity: 'HIGH',     area: 'Secrets',              issue: 'NEXT_PUBLIC vars baked into Docker image build layers',                   fixed: false },
  { id: 15, severity: 'HIGH',     area: 'Database',             issue: 'lib/supabase.ts used anon key for all data operations',                   fixed: true  },
  { id: 17, severity: 'HIGH',     area: 'Database',             issue: 'deleteVideo() not scoped by userId — IDOR risk',                          fixed: true  },
  { id: 21, severity: 'HIGH',     area: 'Next.js',              issue: 'KB article rendering will be stored-XSS risk if DB-backed',               fixed: false },
  { id: 22, severity: 'HIGH',     area: 'Next.js',              issue: 'No image domain allowlist — SSRF via image optimiser',                    fixed: false },
  { id: 23, severity: 'HIGH',     area: 'KB',                   issue: 'Admin KB slugs are static pages, accessible to all users',                fixed: false },
  { id: 7,  severity: 'MEDIUM',   area: 'API',                  issue: '/api/health makes real DB queries publicly routable',                     fixed: false },
  { id: 8,  severity: 'MEDIUM',   area: 'API',                  issue: 'Webhook wildcard makes all /api/webhooks/* public',                       fixed: false },
  { id: 12, severity: 'MEDIUM',   area: 'Test Runner',          issue: 'Test runner inherits full process.env including secrets',                  fixed: false },
  { id: 16, severity: 'MEDIUM',   area: 'Database',             issue: 'Role value mismatch: admin vs global_admin',                              fixed: false },
  { id: 18, severity: 'MEDIUM',   area: 'Input Validation',     issue: 'limit param uncapped — excessive DB queries possible',                    fixed: false },
  { id: 19, severity: 'MEDIUM',   area: 'Input Validation',     issue: 'Video title unsanitised in Content-Disposition header',                   fixed: false },
  { id: 20, severity: 'MEDIUM',   area: 'Business Logic',       issue: 'No credit check before transcript processing',                            fixed: false },
  { id: 25, severity: 'MEDIUM',   area: 'Test Runner',          issue: 'No concurrent run limit — resource exhaustion risk',                      fixed: false },
  { id: 27, severity: 'MEDIUM',   area: 'Clerk',                issue: 'Hard delete on user.deleted — no retention or audit log',                 fixed: false },
  { id: 28, severity: 'MEDIUM',   area: 'Admin UI',             issue: 'Users page was entirely mock — misleading no-op actions',                 fixed: true  },
  { id: 13, severity: 'INFO',     area: 'Secrets',              issue: 'No secrets committed to source — confirmed good practice',                 fixed: true  },
  { id: 26, severity: 'INFO',     area: 'Clerk',                issue: 'Webhook correctly protects tier/role on user.updated',                    fixed: true  },
]

const severityConfig: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: '#c62828', bg: 'rgba(198,40,40,0.12)' },
  HIGH:     { color: '#e65100', bg: 'rgba(230,81,0,0.12)'  },
  MEDIUM:   { color: '#f57c00', bg: 'rgba(245,124,0,0.12)' },
  INFO:     { color: '#1565c0', bg: 'rgba(21,101,192,0.12)' },
}

const priorityItems = [
  {
    label: 'Add global_admin role checks to ALL /api/admin/* routes and admin page server components',
    refs: [1, 2],
  },
  {
    label: 'Remove user: root from docker-compose; replace Docker socket with docker-socket-proxy sidecar',
    refs: [9],
  },
  {
    label: 'Define RLS policies for all Supabase tables (finding 15 is fixed; 14 still open)',
    refs: [14, 15],
  },
  {
    label: 'Add images.remotePatterns and security headers (CSP, X-Frame-Options, HSTS) to next.config.js',
    refs: [22, 6],
  },
  {
    label: 'Remove host port bindings (4002, 4003) from app container definitions',
    refs: [10],
  },
  {
    label: 'Add admin role auth to test runner proxy routes + shared secret between app and runner',
    refs: [24],
  },
  {
    label: 'Fix admin KB article gating to require global_admin',
    refs: [4, 23],
  },
  {
    label: 'Implement rate limiting in Nginx for /api/videos/upload and other API endpoints',
    refs: [5],
  },
]

export default function SecurityPage() {
  const totalFindings = findings.length
  const fixedCount = findings.filter(f => f.fixed).length
  const openCount = totalFindings - fixedCount
  const progressPct = Math.round((fixedCount / totalFindings) * 100)

  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const

  const summaryCards = severities.map(sev => {
    const all = findings.filter(f => f.severity === sev)
    const open = all.filter(f => !f.fixed).length
    const fixed = all.filter(f => f.fixed).length
    return { sev, open, fixed, total: all.length }
  })

  const findingById = (id: number) => findings.find(f => f.id === id)

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* Sub-bar */}
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
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Security</span>
          <span style={{
            fontSize: '11px',
            color: openCount > 0 ? '#c62828' : '#22c55e',
            fontFamily: 'monospace',
            background: openCount > 0 ? 'rgba(198,40,40,0.08)' : 'rgba(34,197,94,0.08)',
            border: `0.5px solid ${openCount > 0 ? 'rgba(198,40,40,0.2)' : 'rgba(34,197,94,0.2)'}`,
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {openCount} OPEN
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#444' }}>Codebase security review — 14 June 2026</span>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Page header */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Security</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Codebase security review — 14 June 2026 &nbsp;&middot;&nbsp; Read-only dashboard
          </p>
        </div>

        {/* Severity summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {summaryCards.map(({ sev, open, fixed, total }) => {
            const cfg = severityConfig[sev]
            return (
              <div key={sev} style={{
                background: '#0d0d0d',
                border: '0.5px solid #1e1e1e',
                borderRadius: '8px',
                borderTop: `2px solid ${cfg.color}`,
                padding: '18px 20px',
              }}>
                <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', fontWeight: 600 }}>
                  {sev}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 600, color: open > 0 ? cfg.color : '#22c55e', lineHeight: 1 }}>
                  {open}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  open of {total}
                </div>
                {fixed > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {fixed} fixed
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Overall progress bar */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Overall Resolution</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>{fixedCount}</span> of {totalFindings} findings resolved
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({progressPct}%)</span>
            </span>
          </div>
          <div style={{ height: '6px', background: '#1e1e1e', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: '#e53935',
              borderRadius: '3px',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#22c55e' }}>{fixedCount} resolved</span>
            <span style={{ fontSize: '11px', color: '#e65100' }}>{openCount} remaining</span>
          </div>
        </div>

        {/* Findings table */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>All Findings</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{totalFindings} total</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                {[
                  { label: '#',        width: '40px'  },
                  { label: 'Severity', width: '120px' },
                  { label: 'Area',     width: '160px' },
                  { label: 'Issue',    width: 'auto'  },
                  { label: 'Status',   width: '90px'  },
                ].map(({ label, width }) => (
                  <th key={label} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: '#555',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width,
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => {
                const cfg = severityConfig[f.severity]
                return (
                  <tr key={f.id} style={{ borderBottom: i < findings.length - 1 ? '0.5px solid #141414' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#444', fontFamily: 'monospace' }}>
                      {f.id}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: cfg.bg,
                        color: cfg.color,
                        border: `0.5px solid ${cfg.color}44`,
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}>
                        {f.severity}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: f.fixed ? '#444' : 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {f.area}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '13px', color: f.fixed ? 'rgba(255,255,255,0.3)' : 'var(--text-primary)' }}>
                      {f.issue}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {f.fixed ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(34,197,94,0.1)',
                          color: '#22c55e',
                          border: '0.5px solid rgba(34,197,94,0.2)',
                          whiteSpace: 'nowrap',
                        }}>
                          Fixed &#10003;
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(234,179,8,0.1)',
                          color: '#eab308',
                          border: '0.5px solid rgba(234,179,8,0.2)',
                        }}>
                          Open
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Priority action plan */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1e1e1e' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Priority Action Plan</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Top 8 remediation steps</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {priorityItems.map((item, idx) => {
              const allFixed = item.refs.every(id => findingById(id)?.fixed)
              const openRefs = item.refs.filter(id => !findingById(id)?.fixed)

              return (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px 20px',
                  borderBottom: idx < priorityItems.length - 1 ? '0.5px solid #141414' : 'none',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    flexShrink: 0,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: allFixed ? 'rgba(34,197,94,0.1)' : 'rgba(229,57,53,0.08)',
                    border: `0.5px solid ${allFixed ? 'rgba(34,197,94,0.3)' : 'rgba(229,57,53,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: allFixed ? '#22c55e' : '#e53935',
                    marginTop: '1px',
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      color: allFixed ? 'var(--text-muted)' : 'var(--text-primary)',
                      lineHeight: 1.5,
                      textDecoration: allFixed ? 'line-through' : 'none',
                    }}>
                      {item.label}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {item.refs.map(id => {
                        const isFixed = findingById(id)?.fixed ?? false
                        return (
                          <span key={id} style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isFixed ? 'rgba(34,197,94,0.08)' : 'rgba(229,57,53,0.08)',
                            color: isFixed ? '#22c55e' : '#e53935',
                            border: `0.5px solid ${isFixed ? 'rgba(34,197,94,0.2)' : 'rgba(229,57,53,0.15)'}`,
                          }}>
                            #{id}{isFixed ? ' ✓' : ''}
                          </span>
                        )
                      })}
                      {allFixed ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', marginLeft: '4px' }}>Done</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          {openRefs.length} finding{openRefs.length > 1 ? 's' : ''} still open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
