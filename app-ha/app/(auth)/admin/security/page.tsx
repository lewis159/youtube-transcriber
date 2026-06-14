import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SecurityPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        gap: '12px', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Security</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA</span>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px' }}>
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '32px' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Security Centre</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#888' }}>
              —
              <span style={{
                display: 'inline-block',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#E53935',
                boxShadow: '0 0 0 0 rgba(229,57,53,0.4)',
                animation: 'pulse-red 2s ease-in-out infinite',
              }} />
              <style>{`
                @keyframes pulse-red {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.4); }
                  50% { box-shadow: 0 0 0 6px rgba(229,57,53,0); }
                }
              `}</style>
              Coming Soon
            </span>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 0, marginBottom: '28px' }}>
            Weekly automated security scanning, CVE reports, dependency vulnerability tracking, and Playwright test suite will live here.
          </p>

          {/* Subsections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            <div style={{ padding: '16px 20px', borderRadius: '8px', background: '#111', border: '0.5px solid #2a2a2a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px' }}>🔍</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Vulnerability Scanner</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#1a1a1a', color: '#555', border: '0.5px solid #2a2a2a' }}>Not yet active</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Automated weekly Trivy scan of Docker images, node_modules, and configs
              </p>
            </div>

            <div style={{ padding: '16px 20px', borderRadius: '8px', background: '#111', border: '0.5px solid #2a2a2a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px' }}>🧪</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Test Suite</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#1a1a1a', color: '#555', border: '0.5px solid #2a2a2a' }}>Not yet active</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Playwright tests covering all pages, sections, and buttons
              </p>
            </div>
          </div>

          {/* Note */}
          <div style={{ padding: '12px 16px', borderRadius: '6px', background: 'rgba(229,57,53,0.04)', border: '0.5px solid rgba(229,57,53,0.15)', fontSize: '13px', color: '#888' }}>
            This section is under active development. Check back soon.
          </div>
        </div>
      </div>
    </div>
  )
}
