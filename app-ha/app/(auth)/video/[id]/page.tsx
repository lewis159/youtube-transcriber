'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

interface VideoDetail {
  id: string
  title: string
  youtube_id: string
  status: string
  created_at: string
  thumbnail?: string
}

interface TranscriptData {
  content: TranscriptSegment[]
  language?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [exportingFmt, setExportingFmt] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [vRes, tRes] = await Promise.all([
          fetch(`/api/videos/${id}`),
          fetch(`/api/videos/${id}/transcript`),
        ])
        if (vRes.ok) setVideo(await vRes.json())
        if (tRes.ok) setTranscript(await tRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleExport(format: 'txt' | 'srt' | 'pdf' | 'zip') {
    try {
      setExportingFmt(format)
      const res = await fetch(`/api/videos/${id}/export?format=${format}`)
      if (res.status === 403) {
        alert('PDF export requires Creator plan or above. Upgrade to unlock.')
        return
      }
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `transcript.${format === 'zip' ? 'zip' : format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      console.error(e)
      alert('Export failed.')
    } finally {
      setExportingFmt(null)
    }
  }

  async function saveNote() {
    try {
      await fetch(`/api/videos/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: note }),
      })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const segments = transcript?.content ?? []
  const filtered = search
    ? segments.filter(s => s.text.toLowerCase().includes(search.toLowerCase()))
    : segments

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
        Loading transcript…
      </div>
    )
  }

  if (!video) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Video not found.</p>
        <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>← Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</span>
      </div>

      {/* Video header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        <img
          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
          alt={video.title}
          style={{ width: '200px', height: '112px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.3 }}>{video.title}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Added {new Date(video.created_at).toLocaleDateString()}
            {transcript?.language && ` · Language: ${transcript.language.toUpperCase()}`}
            {segments.length > 0 && ` · ${segments.length} segments`}
          </p>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={`https://youtube.com/watch?v=${video.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              ▶ Watch on YouTube
            </a>
            {([
              { fmt: 'txt', label: '.txt' },
              { fmt: 'srt', label: '.srt' },
              { fmt: 'pdf', label: 'PDF ✦' },
              { fmt: 'zip', label: 'All (ZIP)' },
            ] as const).map(({ fmt, label }) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={video.status !== 'completed' || !!exportingFmt}
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  opacity: video.status !== 'completed' ? 0.4 : 1,
                }}
                title={fmt === 'pdf' ? 'Creator plan required' : undefined}
              >
                {exportingFmt === fmt ? 'Exporting…' : `↓ ${label}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* Transcript panel */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Search bar */}
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

          {/* Segments */}
          <div style={{ maxHeight: '560px', overflowY: 'auto', padding: '8px' }}>
            {segments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {video.status === 'completed' ? 'No transcript data found.' : 'Transcript is still processing…'}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No results for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filtered.map((seg, i) => (
                <a
                  key={i}
                  href={`https://youtube.com/watch?v=${video.youtube_id}&t=${Math.floor(seg.start)}`}
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
                    color: 'var(--accent)',
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

        {/* Notes panel */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Notes</div>
          <textarea
            placeholder="Add your notes about this video…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={10}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              resize: 'vertical',
              lineHeight: 1.6,
              outline: 'none',
              width: '100%',
            }}
          />
          <button
            onClick={saveNote}
            className="btn-primary"
            style={{ fontSize: '13px', padding: '10px 16px' }}
          >
            {noteSaved ? '✓ Saved' : 'Save notes'}
          </button>
        </div>

      </div>
    </div>
  )
}

function highlightMatch(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent)', color: 'white', borderRadius: '2px', padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
