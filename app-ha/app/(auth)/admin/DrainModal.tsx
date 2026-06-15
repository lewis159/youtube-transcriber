'use client'

import { useEffect, useState } from 'react'

interface DockerContainer {
  Id: string
  Names: string[]
  State: string
}

interface Picked {
  id: string
  name: string
}

// Drain (stop) a container from the Overview quick action. Reuses the existing
// confirmation API: POST /api/admin/containers/[id]/action with action 'stop'
// and a typed phrase "stop <containerName>".
export default function DrainModal({ onClose }: { onClose: () => void }) {
  const [containers, setContainers] = useState<DockerContainer[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState('')
  const [picked, setPicked]         = useState<Picked | null>(null)
  const [phrase, setPhrase]         = useState('')
  const [error, setError]           = useState('')
  const [draining, setDraining]     = useState(false)
  const [done, setDone]             = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/containers')
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setLoadError(d.error || 'Container API unavailable')
          return
        }
        const data = await res.json()
        const running = (data.containers ?? []).filter((c: DockerContainer) => c.State === 'running')
        setContainers(running)
      } catch {
        setLoadError('Failed to reach container API')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const expected = picked ? `stop ${picked.name}` : ''

  async function confirmDrain() {
    if (!picked) return
    if (phrase.toLowerCase().trim() !== expected.toLowerCase().trim()) {
      setError(`Type exactly: ${expected}`)
      return
    }
    setDraining(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/containers/${picked.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', phrase, containerName: picked.name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Drain failed')
        return
      }
      setDone(`Drain (stop) sent to ${picked.name}`)
    } catch {
      setError('Failed to reach server')
    } finally {
      setDraining(false)
    }
  }

  return (
    <div
      onClick={() => !draining && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d', border: '0.5px solid rgba(229,57,53,0.4)',
          borderRadius: '10px', padding: '24px', width: '460px', maxWidth: '90vw',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>🚰 Drain container</div>

        {done ? (
          <>
            <div style={{
              fontSize: '13px', color: '#22c55e',
              background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.3)',
              borderRadius: '6px', padding: '12px 14px', margin: '16px 0',
            }}>
              ✓ {done}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.4)', color: '#22c55e', cursor: 'pointer', fontWeight: 600 }}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Draining stops a running container. Select one, then confirm by typing the phrase.
            </div>

            {loading && <div style={{ fontSize: '13px', color: '#555', padding: '12px 0' }}>Loading containers…</div>}

            {loadError && !loading && (
              <div style={{ fontSize: '12px', color: '#E53935', background: 'rgba(229,57,53,0.06)', border: '0.5px solid rgba(229,57,53,0.2)', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                {loadError}
              </div>
            )}

            {!loading && !loadError && containers.length === 0 && (
              <div style={{ fontSize: '13px', color: '#555', padding: '12px 0' }}>No running containers found.</div>
            )}

            {!loading && !loadError && containers.length > 0 && (
              <>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Container</div>
                <select
                  value={picked?.id ?? ''}
                  onChange={e => {
                    const c = containers.find(x => x.Id === e.target.value)
                    if (c) {
                      setPicked({ id: c.Id, name: (c.Names?.[0] ?? c.Id).replace(/^\//, '') })
                      setPhrase('')
                      setError('')
                    } else {
                      setPicked(null)
                    }
                  }}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '6px',
                    padding: '10px 14px', color: 'var(--text-primary)', fontSize: '13px',
                    outline: 'none', marginBottom: '16px',
                  }}
                >
                  <option value="">Select a container…</option>
                  {containers.map(c => {
                    const name = (c.Names?.[0] ?? c.Id).replace(/^\//, '')
                    return <option key={c.Id} value={c.Id}>{name}</option>
                  })}
                </select>

                {picked && (
                  <>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      To confirm, type the phrase below exactly as shown:
                    </div>
                    <div style={{
                      background: '#141414', border: '0.5px solid #2a2a2a', borderRadius: '6px',
                      padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px',
                      color: '#e53935', marginBottom: '16px', letterSpacing: '0.02em',
                    }}>
                      {expected}
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={phrase}
                      onChange={e => { setPhrase(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && confirmDrain()}
                      placeholder={expected}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#141414', border: `0.5px solid ${error ? 'rgba(229,57,53,0.5)' : '#2a2a2a'}`,
                        borderRadius: '6px', padding: '10px 14px',
                        color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace',
                        outline: 'none', marginBottom: error ? '8px' : '20px',
                      }}
                    />
                  </>
                )}
              </>
            )}

            {error && <div style={{ fontSize: '12px', color: '#E53935', marginBottom: '16px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={draining}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDrain}
                disabled={draining || !picked}
                style={{
                  fontSize: '13px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600,
                  cursor: picked ? 'pointer' : 'not-allowed', opacity: picked ? 1 : 0.5,
                  background: 'rgba(229,57,53,0.12)', border: '0.5px solid rgba(229,57,53,0.4)', color: '#E53935',
                }}
              >
                {draining ? 'Draining…' : 'Drain container'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
