import { requireGlobalAdminPage } from '@/lib/admin-auth'
import LogViewer from './LogViewer'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  await requireGlobalAdminPage()

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        gap: '12px', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Logs</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        <span style={{ fontSize: '11px', color: '#555' }}>Transcription event logs (read-only)</span>
      </div>

      <LogViewer />
    </div>
  )
}
