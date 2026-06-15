'use client'

import { useState } from 'react'

interface TranscriptItem {
  text: string
  start: number
  duration: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#E53935', color: 'white', borderRadius: '2px', padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function TranscriptViewer({
  segments,
  youtubeId,
}: {
  segments: TranscriptItem[]
  youtubeId: string
}) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? segments.filter(s => s.text.toLowerCase().includes(search.toLowerCase()))
    : segments

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search transcript…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
        {search && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {filtered.length} results
          </span>
        )}
      </div>

      <div style={{ maxHeight: '560px', overflowY: 'auto', padding: '8px' }}>
        {segments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transcript data found.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No results for &ldquo;{search}&rdquo;
          </div>
        ) : (
          filtered.map((seg, i) => (
            <a
              key={i}
              href={`https://youtube.com/watch?v=${youtubeId}&t=${Math.floor(seg.start)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                fontSize: '11px',
                color: '#E53935',
                fontFamily: 'monospace',
                flexShrink: 0,
                marginTop: '2px',
                minWidth: '36px',
              }}>
                {formatTime(seg.start)}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {search ? highlightMatch(seg.text, search) : seg.text}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
