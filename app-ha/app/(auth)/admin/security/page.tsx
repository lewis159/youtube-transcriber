import { requireGlobalAdminPage } from '@/lib/admin-auth'
import { getAuditLog } from '@/lib/audit'
import SecurityTabs from './SecurityTabs'

export const dynamic = 'force-dynamic'

type Tab = 'overview' | 'events' | 'audit'

function resolveTab(value: string | string[] | undefined): Tab {
  const v = Array.isArray(value) ? value[0] : value
  if (v === 'events' || v === 'audit' || v === 'overview') return v
  return 'overview'
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  await requireGlobalAdminPage()

  const { tab } = await searchParams
  const initialTab = resolveTab(tab)

  // Real audit rows from admin_audit_log (empty array if the table has no rows).
  const auditLogs = await getAuditLog(200)

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
        gap: '12px',
        position: 'sticky',
        top: '60px',
        zIndex: 50,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Security</span>
        <span style={{ fontSize: '11px', color: '#555' }}>Logs, audit &amp; security signals (read-only)</span>
      </div>

      <SecurityTabs initialTab={initialTab} auditLogs={auditLogs} />
    </div>
  )
}
