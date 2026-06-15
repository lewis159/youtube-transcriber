'use client'

import { useState } from 'react'
import type { ChangelogEntry } from '@/lib/supabase'

const PER_PAGE = 2

const btnBase: React.CSSProperties = {
  padding: '7px 18px',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  background: 'transparent',
  border: '0.5px solid #2a2a2a',
  color: 'var(--text-secondary)',
  transition: 'all 0.15s',
}

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  opacity: 0.35,
  cursor: 'not-allowed',
}

export default function ChangelogClient({ versions }: { versions: ChangelogEntry[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(versions.length / PER_PAGE)
  const paginatedVersions = versions.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Version History</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <button style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'pointer' }}>
          + Add version
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {paginatedVersions.map(v => (
            <div
              key={v.id}
              style={{
                background: '#0d0d0d',
                border: '0.5px solid #1e1e1e',
                borderRadius: '8px',
                borderLeft: `3px solid ${v.borderColor}`,
                padding: '24px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{v.version}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{v.label}</span>
                {v.isCurrent && (
                  <span style={{ fontSize: '11px', color: '#E53935', background: 'rgba(229,57,53,0.1)', border: '0.5px solid rgba(229,57,53,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>CURRENT</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '20px', fontFamily: 'monospace' }}>{v.date}</div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: v.isCurrent ? '#E53935' : '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>New Features</div>
                {v.newFeatures.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: v.isCurrent ? '#E53935' : '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Changes</div>
                {v.changes.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#555', marginTop: '1px', flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c}</span>
                  </div>
                ))}
              </div>

              {v.removed.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Removed</div>
                  {v.removed.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#f59e0b', marginTop: '1px', flexShrink: 0 }}>−</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={page === 1 ? btnDisabled : btnBase}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={page === totalPages ? btnDisabled : btnBase}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
