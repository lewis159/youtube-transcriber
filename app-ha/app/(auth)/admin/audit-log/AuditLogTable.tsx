'use client'

import { useMemo, useState } from 'react'
import type { AuditLogRow } from '@/lib/audit'

const actionColors: Record<string, { bg: string; color: string }> = {
  tier_change:       { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
  refund_issued:     { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
  feature_override:  { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  user_suspended:    { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  user_unsuspended:  { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  credit_granted:    { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  org_created:       { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  container_drained: { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  container_start:   { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  container_stop:    { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
  container_pause:   { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
  container_kill:    { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  password_reset:    { bg: 'rgba(107,114,128,0.1)',color: '#9ca3af' },
  broadcast_sent:    { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
}

export default function AuditLogTable({ logs }: { logs: AuditLogRow[] }) {
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const actionTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs]
  )

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (action && log.action !== action) return false
      if (search && !log.target.toLowerCase().includes(search.toLowerCase())) return false
      const day = log.ts.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    })
  }, [logs, action, search, from, to])

  return (
    <div style={{ padding: '24px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }} />
        <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }}>
          <option value="">All action types</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by target..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
              {['Timestamp', 'Admin', 'Action', 'Target', 'Details'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#555' }}>
                  No audit entries.
                </td>
              </tr>
            )}
            {filtered.map((log, i) => {
              const style = actionColors[log.action] || { bg: 'rgba(255,255,255,0.05)', color: '#888' }
              return (
                <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #141414' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.ts}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.admin}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: style.bg, color: style.color, fontWeight: 600, fontFamily: 'monospace' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500 }}>{log.target}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{log.details}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
