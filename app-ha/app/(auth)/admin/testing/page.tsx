'use client'

import { useEffect, useState, useCallback } from 'react'

const SCRIPTS = [
  { id: 'landing', label: 'Landing Page', description: 'All elements and buttons on the landing page', icon: '🏠' },
  { id: 'auth', label: 'Auth Flow', description: 'Sign-in, sign-up, redirect protection for all routes', icon: '🔐' },
  { id: 'dashboard', label: 'Dashboard', description: 'Dashboard and settings redirect protection', icon: '📊' },
  { id: 'knowledge-base', label: 'Knowledge Base', description: 'KB index, articles, PDF export button, interactions', icon: '📖' },
  { id: 'admin', label: 'Admin Routes', description: 'All admin route redirect protection', icon: '⚙️' },
  { id: 'admin-overview', label: 'Admin Overview', description: 'All admin section redirect checks', icon: '🛡️' },
  { id: 'admin-users', label: 'Admin Users', description: 'Users page redirect and URL preservation', icon: '👥' },
  { id: 'admin-containers', label: 'Admin Containers', description: 'Container API and redirect checks', icon: '🐳' },
  { id: 'kb-articles', label: 'KB Articles', description: 'Knowledge base articles comprehensive test', icon: '📄' },
  { id: 'full-suite', label: 'Full Suite', description: 'All critical checks in one run — 30+ assertions', icon: '🚀' },
]

type Status = 'idle' | 'running' | 'passed' | 'failed'

interface CardState {
  status: Status
  output: string
  duration_ms: number | null
  lastRun: Date | null
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function TestingPage() {
  const [runnerOnline, setRunnerOnline] = useState<boolean | null>(null)
  const [cards, setCards] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(SCRIPTS.map(s => [s.id, { status: 'idle', output: '', duration_ms: null, lastRun: null }]))
  )
  const [runningAll, setRunningAll] = useState(false)

  // Check runner health on mount
  useEffect(() => {
    fetch('/api/admin/tests')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setRunnerOnline(data.ok === true))
      .catch(() => setRunnerOnline(false))
  }, [])

  const runScript = useCallback(async (scriptId: string) => {
    setCards(prev => ({
      ...prev,
      [scriptId]: { ...prev[scriptId], status: 'running', output: '' },
    }))

    try {
      const res = await fetch(`/api/admin/tests/${scriptId}`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setCards(prev => ({
          ...prev,
          [scriptId]: {
            status: 'failed',
            output: data.error || 'Request failed',
            duration_ms: null,
            lastRun: new Date(),
          },
        }))
        return
      }

      setCards(prev => ({
        ...prev,
        [scriptId]: {
          status: data.passed ? 'passed' : 'failed',
          output: data.output || '',
          duration_ms: data.duration_ms ?? null,
          lastRun: new Date(),
        },
      }))
    } catch (err) {
      setCards(prev => ({
        ...prev,
        [scriptId]: {
          status: 'failed',
          output: 'Network error — could not reach the test runner API.',
          duration_ms: null,
          lastRun: new Date(),
        },
      }))
    }
  }, [])

  const runAll = useCallback(async () => {
    setRunningAll(true)
    for (const script of SCRIPTS) {
      await runScript(script.id)
    }
    setRunningAll(false)
  }, [runScript])

  return (
    <div style={{ padding: '40px 32px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Test Suite
              </h1>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(229,57,53,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(229,57,53,0.25)',
                letterSpacing: '0.05em',
              }}>
                ALPHA v0.1.0
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: runnerOnline === null ? '#888' : runnerOnline ? '#4caf50' : '#E53935',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {runnerOnline === null
                  ? 'Checking test runner…'
                  : runnerOnline
                  ? 'Test runner: online'
                  : 'Test runner: offline'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={runAll}
          disabled={runningAll || runnerOnline === false}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: runningAll || runnerOnline === false ? 'not-allowed' : 'pointer',
            background: runningAll || runnerOnline === false ? 'rgba(229,57,53,0.3)' : 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            opacity: runningAll || runnerOnline === false ? 0.6 : 1,
          }}
        >
          {runningAll ? '⏳ Running All…' : '▶ Run All'}
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {SCRIPTS.map(script => {
          const card = cards[script.id]
          const isRunning = card.status === 'running'
          const isPassed = card.status === 'passed'
          const isFailed = card.status === 'failed'

          let borderColor = 'var(--border-default)'
          if (isPassed) borderColor = '#4caf50'
          if (isFailed) borderColor = '#E53935'

          return (
            <div
              key={script.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${borderColor}`,
                borderTop: `3px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '20px 24px',
              }}
            >
              {/* Card header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{script.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {script.label} Tests
                    </span>
                    {isPassed && (
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: 'rgba(76,175,80,0.15)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)',
                      }}>
                        ✓ Passed
                      </span>
                    )}
                    {isFailed && (
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: 'rgba(229,57,53,0.15)', color: '#E53935', border: '1px solid rgba(229,57,53,0.3)',
                      }}>
                        ✗ Failed
                      </span>
                    )}
                    {isRunning && (
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: 'rgba(255,193,7,0.15)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)',
                      }}>
                        ⏳ Running…
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Tests: {script.description}
                  </p>
                </div>

                <button
                  onClick={() => runScript(script.id)}
                  disabled={isRunning || runningAll}
                  style={{
                    flexShrink: 0,
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-default)',
                    cursor: isRunning || runningAll ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    color: isRunning || runningAll ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    opacity: isRunning || runningAll ? 0.5 : 1,
                  }}
                >
                  {isRunning ? '⏳ Running…' : '▶ Run'}
                </button>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>
                  Last run:{' '}
                  {card.lastRun
                    ? <strong style={{ color: isPassed ? '#4caf50' : isFailed ? '#E53935' : 'var(--text-primary)' }}>
                        {isPassed ? '✓ Passed' : isFailed ? '✗ Failed' : ''} {timeAgo(card.lastRun)}
                      </strong>
                    : <em>Never run</em>}
                </span>
                <span>
                  Duration:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {card.duration_ms !== null ? formatDuration(card.duration_ms) : '—'}
                  </strong>
                </span>
              </div>

              {/* Output */}
              {(isRunning || card.output) && (
                <div style={{ marginTop: '16px' }}>
                  {isRunning && !card.output && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Running Playwright tests, please wait…
                    </p>
                  )}
                  {card.output && (
                    <pre style={{
                      margin: 0,
                      padding: '12px 16px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: 'var(--text-primary)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {card.output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
