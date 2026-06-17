'use client'

import { useState } from 'react'
import type { AuditLogRow } from '@/lib/audit'
import SecurityOverview from './SecurityOverview'
import LogViewer from '../logs/LogViewer'
import AuditLogTable from '../audit-log/AuditLogTable'

type Tab = 'overview' | 'events' | 'audit'

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'overview', label: 'Overview', hint: 'Real signals from event_logs' },
  { key: 'events', label: 'Event Logs', hint: 'Transcription lifecycle + errors' },
  { key: 'audit', label: 'Audit Log', hint: 'Admin actions' },
]

function tabBtn(active: boolean): React.CSSProperties {
  return {
    fontSize: '13px',
    fontWeight: 500,
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    background: active ? 'rgba(229,57,53,0.1)' : 'transparent',
    color: active ? '#E53935' : '#888',
    border: active ? '0.5px solid rgba(229,57,53,0.25)' : '0.5px solid transparent',
    transition: 'all 0.15s',
  }
}

export default function SecurityTabs({
  initialTab,
  auditLogs,
}: {
  initialTab: Tab
  auditLogs: AuditLogRow[]
}) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Security</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Logs, audit trail and security signals — all read from live data.
        </p>
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '0.5px solid #1e1e1e', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)} title={t.hint}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sections — only the active one is shown, but all are mounted client-side */}
      {tab === 'overview' && (
        <section>
          <SecurityOverview />
        </section>
      )}

      {tab === 'events' && (
        <section>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#555' }}>
            Transcription lifecycle + error events from <code style={{ fontFamily: 'monospace', color: '#888' }}>event_logs</code> (read-only).
          </div>
          {/* LogViewer manages its own data + filters via /api/admin/logs */}
          <div style={{ marginLeft: '-24px', marginRight: '-24px' }}>
            <LogViewer />
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#555' }}>
            Recorded admin actions from <code style={{ fontFamily: 'monospace', color: '#888' }}>admin_audit_log</code>.
          </div>
          {auditLogs.length === 0 ? (
            <div style={{
              background: '#0d0d0d',
              border: '0.5px solid #1e1e1e',
              borderRadius: '8px',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                No admin actions recorded yet
              </div>
              <div style={{ fontSize: '13px', color: '#555', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                Admin actions (tier changes, refunds, container controls, etc.) are written to
                {' '}<code style={{ fontFamily: 'monospace', color: '#777' }}>admin_audit_log</code>{' '}
                via <code style={{ fontFamily: 'monospace', color: '#777' }}>logAudit()</code>. Entries will appear
                here as soon as the first action is logged.
              </div>
            </div>
          ) : (
            <div style={{ marginLeft: '-24px', marginRight: '-24px' }}>
              <AuditLogTable logs={auditLogs} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
