'use client'

import { useState } from 'react'

type Level = 'info' | 'warning' | 'critical'

const LEVELS: { value: Level; label: string; color: string }[] = [
  { value: 'info',     label: 'Info',     color: '#60a5fa' },
  { value: 'warning',  label: 'Warning',  color: '#eab308' },
  { value: 'critical', label: 'Critical', color: '#E53935' },
]

export default function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [level, setLevel]     = useState<Level>('info')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  async function submit() {
    if (!message.trim()) {
      setError('Message is required')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), level }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to broadcast')
        return
      }
      setSent(true)
    } catch {
      setError('Failed to reach server')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={() => !sending && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d', border: '0.5px solid #2a2a2a',
          borderRadius: '10px', padding: '24px', width: '460px', maxWidth: '90vw',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>📣 Broadcast message</div>

        {sent ? (
          <>
            <div style={{
              fontSize: '13px', color: '#22c55e',
              background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.3)',
              borderRadius: '6px', padding: '12px 14px', margin: '16px 0',
            }}>
              ✓ Announcement broadcast. It is now active site-wide.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.4)', color: '#22c55e', cursor: 'pointer', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Compose a message shown as a banner to users. The latest active announcement is displayed.
            </div>

            <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {LEVELS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  style={{
                    flex: 1, fontSize: '12px', padding: '7px 0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                    background: level === l.value ? `${l.color}18` : 'transparent',
                    border: `0.5px solid ${level === l.value ? l.color : '#2a2a2a'}`,
                    color: level === l.value ? l.color : 'var(--text-secondary)',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              value={message}
              onChange={e => { setMessage(e.target.value); setError('') }}
              placeholder="e.g. Scheduled maintenance tonight 22:00–23:00 UTC."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                background: '#141414', border: `0.5px solid ${error ? 'rgba(229,57,53,0.5)' : '#2a2a2a'}`,
                borderRadius: '6px', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit',
                outline: 'none', marginBottom: error ? '8px' : '20px',
              }}
            />
            {error && <div style={{ fontSize: '12px', color: '#E53935', marginBottom: '16px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={sending}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={sending}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '6px', background: 'rgba(229,57,53,0.12)', border: '0.5px solid rgba(229,57,53,0.4)', color: '#E53935', cursor: 'pointer', fontWeight: 600 }}
              >
                {sending ? 'Broadcasting…' : 'Broadcast'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
