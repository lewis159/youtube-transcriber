'use client'

import { useEffect, useState, useCallback } from 'react'

interface DockerContainer {
  Id: string
  Names: string[]
  Image: string
  Status: string
  State: string
  Ports: { IP?: string; PrivatePort: number; PublicPort?: number; Type: string }[]
  Created: number
  Labels?: Record<string, string>
}

interface GroupedContainers {
  [group: string]: DockerContainer[]
}

type ActionType = 'start' | 'stop' | 'pause' | 'unpause' | 'restart' | 'kill'

interface PendingAction {
  containerId: string
  containerName: string
  action: ActionType
}

const PROJECT_LABEL = 'yt-transcriber'

// Name tokens that identify this project's containers (case-insensitive substring match).
const PROJECT_NAME_TOKENS = [
  'app-ha',
  'nginx-ha',
  'app-400',
  'test-runner',
  'youtube-transcriber',
  'yt-transcriber',
  'yt_transcriber',
  'youtube_transcriber',
]

// Label values / keys that identify this project (case-insensitive substring match).
const PROJECT_LABEL_SUBSTRINGS = [
  'youtube',
  'transcri',
  'yt-trans',
  'yt_trans',
  'yt-transcription',
]

// Labels whose values we inspect for the project substrings above.
const PROJECT_LABEL_KEYS = [
  'com.docker.compose.project',
  'project',
  'com.docker.stack.namespace',
]

const GROUP_PREFIXES: Record<string, string> = {
  nginx:    'Nginx',
  app:      'App',
  redis:    'Redis',
  sentinel: 'Sentinel',
}

const ACTION_META: Record<ActionType, { label: string; icon: string; danger: boolean }> = {
  start:   { label: 'Start',   icon: '▶',  danger: false },
  stop:    { label: 'Stop',    icon: '⏹',  danger: true  },
  pause:   { label: 'Pause',   icon: '⏸',  danger: false },
  unpause: { label: 'Unpause', icon: '▶▶', danger: false },
  restart: { label: 'Restart', icon: '↺',  danger: false },
  kill:    { label: 'Kill',    icon: '✕',   danger: true  },
}

function isProjectContainer(c: DockerContainer): boolean {
  const name = (c.Names?.[0] ?? '').replace(/^\//, '').toLowerCase()

  // 1. Name matches a known project token.
  if (PROJECT_NAME_TOKENS.some(t => name.includes(t))) return true

  // 2. Project redis (exactly `redis` or starts with `redis`).
  if (name === 'redis' || name.startsWith('redis')) return true

  // 3. Any label value contains a project substring.
  const labelValues = Object.values(c.Labels ?? {}).map(v => (v ?? '').toLowerCase())
  if (labelValues.some(v => PROJECT_LABEL_SUBSTRINGS.some(s => v.includes(s)))) return true

  // 3b. Specific compose/stack label keys contain a project substring.
  for (const key of PROJECT_LABEL_KEYS) {
    const val = (c.Labels?.[key] ?? '').toLowerCase()
    if (PROJECT_LABEL_SUBSTRINGS.some(s => val.includes(s))) return true
  }

  return false
}

function getGroup(name: string): string {
  const lower = name.toLowerCase().replace(/^\//, '')
  for (const [prefix, label] of Object.entries(GROUP_PREFIXES)) {
    if (lower.includes(prefix)) return label
  }
  return 'Other'
}

function statusBadge(state: string, status: string) {
  const isUnhealthy = status.toLowerCase().includes('unhealthy')
  const color = isUnhealthy ? '#E53935' : state === 'running' ? '#22c55e' : state === 'paused' ? '#eab308' : '#888'
  const label = isUnhealthy ? 'unhealthy' : state
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${color}18`, color, fontWeight: 600 }}>
      {label}
    </span>
  )
}

function formatPorts(ports: DockerContainer['Ports']): string {
  if (!ports?.length) return '—'
  return ports.filter(p => p.PublicPort).map(p => `${p.PublicPort}→${p.PrivatePort}`).join(', ') || '—'
}

function availableActions(state: string): ActionType[] {
  if (state === 'running') return ['pause', 'stop', 'restart', 'kill']
  if (state === 'paused')  return ['unpause', 'stop', 'kill']
  return ['start']
}

export default function ContainersPage() {
  const [allContainers, setAllContainers] = useState<DockerContainer[]>([])
  const [showAll, setShowAll]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [errorReason, setErrorReason]     = useState<'unreachable' | 'error' | null>(null)
  const [errorTarget, setErrorTarget]     = useState<string>('')
  const [lastUpdated, setLastUpdated]     = useState('')
  const [loading, setLoading]             = useState(true)
  const [pending, setPending]             = useState<PendingAction | null>(null)
  const [phrase, setPhrase]               = useState('')
  const [phraseError, setPhraseError]     = useState('')
  const [acting, setActing]               = useState(false)
  const [toast, setToast]                 = useState<string | null>(null)

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/containers')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Docker endpoint unavailable')
        setErrorReason(data.reason === 'error' ? 'error' : 'unreachable')
        setErrorTarget(data.target || '')
        return
      }
      const data = await res.json()
      setAllContainers(data.containers ?? [])
      setError(null)
      setErrorReason(null)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setError('Failed to reach the container API (the Next.js app itself did not respond).')
      setErrorReason('error')
      setErrorTarget('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 10_000)
    return () => clearInterval(interval)
  }, [fetchContainers])

  const projectMatches = allContainers.filter(isProjectContainer)
  // Safety net: if the filter matches nothing but containers DO exist, fall back to showing all.
  const filterFellBack = !showAll && projectMatches.length === 0 && allContainers.length > 0
  const displayed = showAll || filterFellBack ? allContainers : projectMatches

  const grouped: GroupedContainers = {}
  for (const c of displayed) {
    const name = (c.Names?.[0] ?? c.Id).replace(/^\//, '')
    const group = getGroup(name)
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(c)
  }

  const groupOrder = ['Nginx', 'App', 'Redis', 'Sentinel', 'Other']
  const sortedGroups = groupOrder.filter(g => grouped[g])

  function openModal(c: DockerContainer, action: ActionType) {
    const name = (c.Names?.[0] ?? c.Id).replace(/^\//, '')
    setPending({ containerId: c.Id, containerName: name, action })
    setPhrase('')
    setPhraseError('')
  }

  function closeModal() {
    if (acting) return
    setPending(null)
    setPhrase('')
    setPhraseError('')
  }

  async function confirmAction() {
    if (!pending) return
    const expected = `${pending.action} ${pending.containerName}`.toLowerCase().trim()
    if (phrase.toLowerCase().trim() !== expected) {
      setPhraseError(`Type exactly: ${pending.action} ${pending.containerName}`)
      return
    }
    setActing(true)
    try {
      const res = await fetch(`/api/admin/containers/${pending.containerId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pending.action, phrase, containerName: pending.containerName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPhraseError(data.error || 'Action failed')
        return
      }
      setPending(null)
      showToast(`${ACTION_META[pending.action].label} sent to ${pending.containerName}`)
      setTimeout(fetchContainers, 1000)
    } catch {
      setPhraseError('Failed to reach server')
    } finally {
      setActing(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const projectCount = projectMatches.length

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
          background: '#0d0d0d', border: '0.5px solid #22c55e', borderRadius: '8px',
          padding: '12px 18px', fontSize: '13px', color: '#22c55e', fontWeight: 500,
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Confirmation modal */}
      {pending && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0d0d', border: `0.5px solid ${ACTION_META[pending.action].danger ? 'rgba(229,57,53,0.4)' : '#2a2a2a'}`,
              borderRadius: '10px', padding: '24px', width: '420px', maxWidth: '90vw',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              Confirm: {ACTION_META[pending.action].label}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              To confirm, type the phrase below exactly as shown:
            </div>
            <div style={{
              background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '6px',
              padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px',
              color: '#e53935', marginBottom: '16px', letterSpacing: '0.02em',
            }}>
              {pending.action} {pending.containerName}
            </div>
            <input
              type="text"
              autoFocus
              value={phrase}
              onChange={e => { setPhrase(e.target.value); setPhraseError('') }}
              onKeyDown={e => e.key === 'Enter' && confirmAction()}
              placeholder={`${pending.action} ${pending.containerName}`}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#141414', border: `0.5px solid ${phraseError ? 'rgba(229,57,53,0.5)' : '#2a2a2a'}`,
                borderRadius: '6px', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace',
                outline: 'none', marginBottom: phraseError ? '8px' : '20px',
              }}
            />
            {phraseError && (
              <div style={{ fontSize: '12px', color: '#E53935', marginBottom: '16px' }}>{phraseError}</div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                disabled={acting}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={acting}
                style={{
                  fontSize: '13px', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                  background: ACTION_META[pending.action].danger ? 'rgba(229,57,53,0.12)' : 'rgba(34,197,94,0.12)',
                  border: `0.5px solid ${ACTION_META[pending.action].danger ? 'rgba(229,57,53,0.4)' : 'rgba(34,197,94,0.4)'}`,
                  color: ACTION_META[pending.action].danger ? '#E53935' : '#22c55e',
                }}
              >
                {acting ? 'Sending…' : `Confirm ${ACTION_META[pending.action].label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Container Monitor</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>Updated: {lastUpdated}</span>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show all containers
          </label>
          <button
            onClick={fetchContainers}
            style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>

        {!loading && !error && filterFellBack && (
          <div style={{
            fontSize: '12px', color: '#eab308',
            background: 'rgba(234,179,8,0.06)', border: '0.5px solid rgba(234,179,8,0.25)',
            borderRadius: '6px', padding: '10px 14px', marginBottom: '16px',
          }}>
            No containers matched the project filter — showing all. Adjust the filter in code if needed.
          </div>
        )}

        {!loading && !error && (
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>
            Showing <strong style={{ color: 'var(--text-secondary)' }}>{displayed.length}</strong> container{displayed.length !== 1 ? 's' : ''}
            {!showAll && ` (${projectCount} matched project: ${PROJECT_LABEL})`}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#555', fontSize: '14px' }}>
            Loading containers…
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: errorReason === 'unreachable' ? 'rgba(234,179,8,0.06)' : 'rgba(229,57,53,0.06)',
            border: `0.5px solid ${errorReason === 'unreachable' ? 'rgba(234,179,8,0.25)' : 'rgba(229,57,53,0.2)'}`,
            borderRadius: '8px', padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>
              {errorReason === 'unreachable' ? '🔌' : '⚠️'}
            </div>
            <div style={{
              fontSize: '14px', fontWeight: 600, marginBottom: '8px',
              color: errorReason === 'unreachable' ? '#eab308' : '#E53935',
            }}>
              {errorReason === 'unreachable'
                ? 'Docker proxy not reachable (deploy dependency)'
                : 'Error talking to Docker'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</div>

            {errorReason === 'unreachable' ? (
              <div style={{ fontSize: '12px', color: '#555', marginTop: '12px', lineHeight: 1.6, textAlign: 'left', maxWidth: '620px', margin: '12px auto 0' }}>
                This is an <strong style={{ color: '#888' }}>environment / deploy</strong> issue, not an app bug. The app reaches
                Docker through the <code style={{ fontFamily: 'monospace', color: '#888' }}>docker-socket-proxy</code> service
                (<code style={{ fontFamily: 'monospace', color: '#888' }}>DOCKER_HOST=tcp://docker-socket-proxy:2375</code>).
                {errorTarget && (
                  <> Tried: <code style={{ fontFamily: 'monospace', color: '#888' }}>{errorTarget}</code>.</>
                )}
                <br /><br />
                To fix: deploy the <code style={{ fontFamily: 'monospace', color: '#888' }}>docker-socket-proxy</code> service
                from <code style={{ fontFamily: 'monospace', color: '#888' }}>docker-compose.prod.yml</code> and make sure it is on the
                same Docker network as this app — or, for local dev only, mount
                <code style={{ fontFamily: 'monospace', color: '#888' }}> /var/run/docker.sock</code> into the app container.
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#555', marginTop: '12px', lineHeight: 1.6, textAlign: 'left', maxWidth: '620px', margin: '12px auto 0' }}>
                The proxy responded but returned an unexpected result.
                {errorTarget && (
                  <> Target: <code style={{ fontFamily: 'monospace', color: '#888' }}>{errorTarget}</code>.</>
                )}
                {' '}Check the <code style={{ fontFamily: 'monospace', color: '#888' }}>docker-socket-proxy</code> permissions
                (it must allow <code style={{ fontFamily: 'monospace', color: '#888' }}>CONTAINERS=1</code>) and the app logs.
              </div>
            )}
          </div>
        )}

        {!loading && !error && sortedGroups.length === 0 && (
          <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '48px' }}>
            No {PROJECT_LABEL} containers found.{' '}
            <button onClick={() => setShowAll(true)} style={{ color: '#E53935', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              Show all containers?
            </button>
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedGroups.map(groupName => (
              <div key={groupName} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupName}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{grouped[groupName].length} container{grouped[groupName].length !== 1 ? 's' : ''}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid #141414' }}>
                      {['Name', 'Status', 'Uptime', 'Ports', 'Actions'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: h === 'Actions' ? 'right' : 'left',
                          fontSize: '11px', color: '#555', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[groupName].map((c, i) => {
                      const name = (c.Names?.[0] ?? c.Id).replace(/^\//, '')
                      const actions = availableActions(c.State)
                      return (
                        <tr key={c.Id} style={{ borderBottom: i < grouped[groupName].length - 1 ? '0.5px solid #141414' : 'none' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{name}</td>
                          <td style={{ padding: '10px 16px' }}>{statusBadge(c.State, c.Status)}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.Status}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{formatPorts(c.Ports)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              {actions.map(action => (
                                <button
                                  key={action}
                                  onClick={() => openModal(c, action)}
                                  title={ACTION_META[action].label}
                                  style={{
                                    padding: '4px 9px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer',
                                    background: 'transparent',
                                    border: `0.5px solid ${ACTION_META[action].danger ? 'rgba(229,57,53,0.35)' : '#2a2a2a'}`,
                                    color: ACTION_META[action].danger ? '#E53935' : 'var(--text-secondary)',
                                  }}
                                >
                                  {ACTION_META[action].icon}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
