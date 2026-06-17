'use client'

import { useEffect, useState } from 'react'

interface OverviewData {
  windowHours: number
  events: {
    total: number
    errors: number
    warns: number
    errorsWindow: number
    warnsWindow: number
  }
  audit: { total: number }
  rls: { enabled: boolean; note: string }
  recentErrors: {
    id: string
    created_at: string
    source: string
    event: string
    message: string | null
  }[]
}

const cardStyle: React.CSSProperties = {
  background: '#0d0d0d',
  border: '0.5px solid #1e1e1e',
  borderRadius: '8px',
  padding: '18px 20px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '10px',
  fontWeight: 600,
}

export default function SecurityOverview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/admin/security')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed (${res.status})`)
        }
        return res.json()
      })
      .then((json: OverviewData) => {
        if (active) setData(json)
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load overview')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div style={{ ...cardStyle, color: '#555', fontSize: '13px' }}>Loading security signals…</div>
    )
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, border: '0.5px solid rgba(229,57,53,0.2)', background: 'rgba(229,57,53,0.06)', color: '#E53935', fontSize: '13px' }}>
        {error}
      </div>
    )
  }

  if (!data) return null

  const cards = [
    { label: `Errors (last ${data.windowHours}h)`, value: data.events.errorsWindow, color: data.events.errorsWindow > 0 ? '#E53935' : '#22c55e' },
    { label: `Warnings (last ${data.windowHours}h)`, value: data.events.warnsWindow, color: data.events.warnsWindow > 0 ? '#eab308' : '#22c55e' },
    { label: 'Total errors (all time)', value: data.events.errors, color: data.events.errors > 0 ? '#e65100' : '#22c55e' },
    { label: 'Total events logged', value: data.events.total, color: 'var(--text-primary)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Signal cards — all values from event_logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {cards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={labelStyle}>{c.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: c.color, lineHeight: 1 }}>
              {c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* RLS + audit posture */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Row-Level Security</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
              background: data.rls.enabled ? 'rgba(34,197,94,0.1)' : 'rgba(229,57,53,0.1)',
              color: data.rls.enabled ? '#22c55e' : '#E53935',
              border: `0.5px solid ${data.rls.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(229,57,53,0.2)'}`,
            }}>
              {data.rls.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {data.rls.note}
          </p>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Admin Audit Trail</div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
            {data.audit.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            recorded admin actions
          </div>
        </div>
      </div>

      {/* Recent errors — real event_logs error rows */}
      <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1e1e1e' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Errors</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            latest error-level events
          </span>
        </div>
        {data.recentErrors.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#22c55e' }}>
            No errors logged. ✓
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                {['Time', 'Source', 'Event', 'Message'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentErrors.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < data.recentErrors.length - 1 ? '0.5px solid #141414' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{row.created_at}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{row.source}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{row.event}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{row.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
