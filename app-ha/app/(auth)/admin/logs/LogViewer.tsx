'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'

type Level = 'info' | 'warn' | 'error'
type Source = 'app' | 'worker'

interface LogRow {
  id: string
  created_at: string
  level: Level
  source: Source
  event: string
  video_id: string | null
  user_id: string | null
  message: string | null
  metadata: Record<string, unknown> | null
}

interface LogsResponse {
  rows: LogRow[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const PAGE_SIZE = 50

const LEVELS: Level[] = ['info', 'warn', 'error']
const SOURCES: Source[] = ['app', 'worker']

// Common lifecycle event keys (from migration 011) for the selector.
const EVENT_TYPES = [
  'video_added',
  'queued',
  'extracting_audio',
  'captions_found',
  'whisper_fallback',
  'transcribing',
  'completed',
  'error',
]

const levelStyles: Record<Level, { bg: string; color: string }> = {
  info:  { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  warn:  { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
  error: { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
}

const sourceStyles: Record<Source, { bg: string; color: string }> = {
  app:    { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
  worker: { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d',
  border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)',
  fontSize: '13px', outline: 'none',
}

function shortId(id: string | null): string {
  if (!id) return '—'
  return id.length > 8 ? id.slice(0, 8) : id
}

function toggleBtn(active: boolean, c: { bg: string; color: string }): React.CSSProperties {
  return {
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
    fontWeight: 600, fontFamily: 'monospace', transition: 'all 0.15s',
    background: active ? c.bg : 'transparent',
    color: active ? c.color : '#555',
    border: active ? `0.5px solid ${c.color}55` : '0.5px solid #2a2a2a',
  }
}

export default function LogViewer() {
  // Filters
  const [levels, setLevels] = useState<Set<Level>>(new Set())
  const [sources, setSources] = useState<Set<Source>>(new Set())
  const [event, setEvent] = useState('')
  const [q, setQ] = useState('')
  const [videoId, setVideoId] = useState('')
  const [userId, setUserId] = useState('')
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')

  // Paging + data
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const buildParams = useCallback((off: number) => {
    const params = new URLSearchParams()
    // Toggles are multi-select in the UI, but the API takes a single value;
    // send the param only when exactly one option is active (an active filter).
    if (levels.size === 1) params.set('level', [...levels][0])
    if (sources.size === 1) params.set('source', [...sources][0])
    if (event) params.set('event', event)
    if (q.trim()) params.set('q', q.trim())
    if (videoId.trim()) params.set('video_id', videoId.trim())
    if (userId.trim()) params.set('user_id', userId.trim())
    if (since) params.set('since', since)
    if (until) params.set('until', until)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(off))
    return params
  }, [levels, sources, event, q, videoId, userId, since, until])

  const load = useCallback(async (off: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/logs?${buildParams(off).toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed (${res.status})`)
      }
      const json: LogsResponse = await res.json()
      setData(json)
      setOffset(off)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  // Initial load + reload whenever filters change (resets to first page).
  useEffect(() => {
    load(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, sources, event, q, videoId, userId, since, until])

  function toggleLevel(l: Level) {
    setLevels((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l); else next.add(l)
      return next
    })
  }
  function toggleSource(s: Source) {
    setSources((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const hasMore = data?.hasMore ?? false
  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = offset + rows.length

  return (
    <div style={{ padding: '24px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {/* Toggles row */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Level</span>
            {LEVELS.map((l) => (
              <button key={l} onClick={() => toggleLevel(l)} style={toggleBtn(levels.has(l), levelStyles[l])}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Source</span>
            {SOURCES.map((s) => (
              <button key={s} onClick={() => toggleSource(s)} style={toggleBtn(sources.has(s), sourceStyles[s])}>{s}</button>
            ))}
          </div>
          <button
            onClick={() => load(offset)}
            disabled={loading}
            style={{ ...inputStyle, marginLeft: 'auto', cursor: loading ? 'default' : 'pointer', color: 'var(--text-primary)' }}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>

        {/* Inputs row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select value={event} onChange={(e) => setEvent(e.target.value)} style={inputStyle}>
            <option value="">All events</option>
            {EVENT_TYPES.map((ev) => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search message…" style={{ ...inputStyle, flex: 1, minWidth: '180px', color: 'var(--text-primary)' }} />
          <input type="text" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="video_id" style={{ ...inputStyle, width: '160px', fontFamily: 'monospace' }} />
          <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id" style={{ ...inputStyle, width: '160px', fontFamily: 'monospace' }} />
          <input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} title="Since" style={inputStyle} />
          <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} title="Until" style={inputStyle} />
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '6px', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', color: '#E53935', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
              {['Time', 'Level', 'Source', 'Event', 'Video', 'User', 'Message', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#555' }}>
                  No log entries.
                </td>
              </tr>
            )}
            {rows.map((log, i) => {
              const ls = levelStyles[log.level] || { bg: 'rgba(255,255,255,0.05)', color: '#888' }
              const ss = sourceStyles[log.source] || { bg: 'rgba(255,255,255,0.05)', color: '#888' }
              const isOpen = expanded.has(log.id)
              const hasMeta = log.metadata && Object.keys(log.metadata).length > 0
              return (
                <Fragment key={log.id}>
                  <tr style={{ borderBottom: i < rows.length - 1 ? '0.5px solid #141414' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.created_at}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: ls.bg, color: ls.color, fontWeight: 600, fontFamily: 'monospace' }}>{log.level}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: ss.bg, color: ss.color, fontWeight: 600, fontFamily: 'monospace' }}>{log.source}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.event}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }} title={log.video_id || ''}>{shortId(log.video_id)}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }} title={log.user_id || ''}>{shortId(log.user_id)}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message || ''}>{log.message || '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      {hasMeta && (
                        <button onClick={() => toggleExpand(log.id)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'monospace' }}>
                          {isOpen ? '▾ meta' : '▸ meta'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {hasMeta && isOpen && (
                    <tr style={{ borderBottom: i < rows.length - 1 ? '0.5px solid #141414' : 'none' }}>
                      <td colSpan={8} style={{ padding: '0 16px 12px 16px' }}>
                        <pre style={{ margin: 0, padding: '12px', borderRadius: '6px', background: '#080808', border: '0.5px solid #1e1e1e', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
          {total === 0 ? '0 entries' : `${pageStart}–${pageEnd} of ${total}`}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => load(Math.max(offset - PAGE_SIZE, 0))}
            disabled={loading || offset === 0}
            style={{ ...inputStyle, cursor: loading || offset === 0 ? 'default' : 'pointer', opacity: offset === 0 ? 0.4 : 1, color: 'var(--text-primary)' }}
          >
            ← Prev
          </button>
          <button
            onClick={() => load(offset + PAGE_SIZE)}
            disabled={loading || !hasMore}
            style={{ ...inputStyle, cursor: loading || !hasMore ? 'default' : 'pointer', opacity: !hasMore ? 0.4 : 1, color: 'var(--text-primary)' }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
