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
}

interface GroupedContainers {
  [group: string]: DockerContainer[]
}

const GROUP_PREFIXES: Record<string, string> = {
  nginx:    'Nginx',
  app:      'App',
  redis:    'Redis',
  sentinel: 'Sentinel',
}

function getGroup(name: string): string {
  const lower = name.toLowerCase().replace(/^\//, '')
  for (const [prefix, label] of Object.entries(GROUP_PREFIXES)) {
    if (lower.startsWith(prefix)) return label
  }
  return 'Other'
}

function statusBadge(state: string, status: string) {
  const isRunning  = state === 'running'
  const isUnhealthy = status.toLowerCase().includes('unhealthy')
  const color  = isUnhealthy ? '#E53935' : isRunning ? '#22c55e' : '#eab308'
  const label  = isUnhealthy ? 'unhealthy' : state
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${color}18`, color, fontWeight: 600 }}>
      {label}
    </span>
  )
}

function formatUptime(status: string): string {
  // Status string from Docker is e.g. "Up 3 hours" or "Exited (0) 2 days ago"
  return status
}

function formatPorts(ports: DockerContainer['Ports']): string {
  if (!ports || ports.length === 0) return '—'
  return ports
    .filter((p) => p.PublicPort)
    .map((p) => `${p.PublicPort}→${p.PrivatePort}`)
    .join(', ') || '—'
}

export default function ContainersPage() {
  const [groups, setGroups]         = useState<GroupedContainers>({})
  const [error, setError]           = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading]       = useState(true)

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/containers')
      if (res.status === 503) {
        const data = await res.json()
        setError(data.error || 'Docker socket unavailable')
        return
      }
      const data = await res.json()
      const grouped: GroupedContainers = {}
      for (const c of (data.containers as DockerContainer[])) {
        const name  = c.Names?.[0] ?? c.Id
        const group = getGroup(name)
        if (!grouped[group]) grouped[group] = []
        grouped[group].push(c)
      }
      setGroups(grouped)
      setError(null)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      setError('Failed to reach container API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 10_000)
    return () => clearInterval(interval)
  }, [fetchContainers])

  const groupOrder = ['Nginx', 'App', 'Redis', 'Sentinel', 'Other']
  const sortedGroups = groupOrder.filter((g) => groups[g])

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
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
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>Last updated: {lastUpdated}</span>
          )}
          <button
            onClick={fetchContainers}
            style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#555', fontSize: '14px' }}>
            Loading containers...
          </div>
        )}

        {error && !loading && (
          <div style={{ background: 'rgba(229,57,53,0.06)', border: '0.5px solid rgba(229,57,53,0.2)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔌</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#E53935', marginBottom: '8px' }}>Docker socket unavailable</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>Ensure the container has <code style={{ fontFamily: 'monospace', color: '#888' }}>/var/run/docker.sock</code> mounted read-only.</div>
          </div>
        )}

        {!loading && !error && sortedGroups.length === 0 && (
          <div style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '48px' }}>
            No containers found.
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedGroups.map((groupName) => (
              <div key={groupName} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupName}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{groups[groupName].length} container{groups[groupName].length !== 1 ? 's' : ''}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid #141414' }}>
                      {['Name', 'Status', 'Uptime', 'Ports'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups[groupName].map((c, i) => {
                      const name = (c.Names?.[0] ?? c.Id).replace(/^\//, '')
                      return (
                        <tr key={c.Id} style={{ borderBottom: i < groups[groupName].length - 1 ? '0.5px solid #141414' : 'none' }}>
                          <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{name}</td>
                          <td style={{ padding: '10px 16px' }}>{statusBadge(c.State, c.Status)}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{formatUptime(c.Status)}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{formatPorts(c.Ports)}</td>
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
