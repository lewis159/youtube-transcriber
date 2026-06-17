'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function LocalTranscriptionToggle() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Fetch current state on mount.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/settings/local-transcription')
        if (!res.ok) throw new Error('Failed to load setting')
        const data = await res.json()
        if (!active) return
        setAllowed(!!data.allowed)
        setEnabled(!!data.enabled)
      } catch {
        if (active) setError('Could not load this setting.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleToggle() {
    if (!allowed || saveState === 'saving') return
    const next = !enabled
    // Optimistic update.
    setEnabled(next)
    setSaveState('saving')
    setError(null)
    try {
      const res = await fetch('/api/settings/local-transcription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save')
      }
      const data = await res.json()
      setAllowed(!!data.allowed)
      setEnabled(!!data.enabled)
      setSaveState('saved')
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1800)
    } catch (err) {
      // Roll back the optimistic change.
      setEnabled(!next)
      setSaveState('error')
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const interactive = allowed && !loading
  const isOn = interactive && enabled

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ maxWidth: '460px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Local transcription</span>
          {!loading && !allowed && (
            <span
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Locked
            </span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Transcribe videos that don&apos;t have captions, using our own engine.
        </div>
        {!loading && !allowed && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Not available on your current plan.{' '}
            <Link href="/#pricing" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              View pricing
            </Link>
          </div>
        )}
        {allowed && saveState === 'saving' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Saving…</div>
        )}
        {allowed && saveState === 'saved' && (
          <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px' }}>Saved</div>
        )}
        {allowed && error && (
          <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px' }}>{error}</div>
        )}
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label="Local transcription"
        disabled={!interactive || saveState === 'saving'}
        onClick={handleToggle}
        title={!allowed && !loading ? 'Not available on your current plan' : undefined}
        style={{
          flexShrink: 0,
          position: 'relative',
          width: '46px',
          height: '26px',
          borderRadius: '13px',
          border: '1px solid var(--border-default)',
          background: isOn ? 'var(--accent)' : 'var(--bg-elevated)',
          cursor: interactive && saveState !== 'saving' ? 'pointer' : 'not-allowed',
          opacity: interactive ? 1 : 0.5,
          transition: 'background 0.15s ease',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: isOn ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    </div>
  )
}
