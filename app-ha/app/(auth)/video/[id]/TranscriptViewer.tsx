'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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

// Track loading of the YouTube IFrame API script across component instances.
let ytApiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as any
  if (w.YT && w.YT.Player) return Promise.resolve()
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve()
    }
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
  return ytApiPromise
}

export default function TranscriptViewer({
  segments,
  youtubeId,
  videoId,
  title,
}: {
  segments: TranscriptItem[]
  youtubeId: string
  videoId: string
  title: string
}) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const playerRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Wire up the YouTube IFrame Player API on the embedded iframe.
  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then(() => {
      if (cancelled || !iframeRef.current) return
      const w = window as any
      try {
        playerRef.current = new w.YT.Player(iframeRef.current, {})
      } catch {
        playerRef.current = null
      }
    })
    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy?.()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    }
  }, [youtubeId])

  const seekTo = useCallback((seconds: number) => {
    const p = playerRef.current
    if (!p || typeof p.seekTo !== 'function') return // graceful fallback
    try {
      p.seekTo(Math.floor(seconds), true)
      if (typeof p.playVideo === 'function') p.playVideo()
    } catch {
      /* ignore */
    }
  }, [])

  const filtered = search
    ? segments.filter(s => s.text.toLowerCase().includes(search.toLowerCase()))
    : segments

  async function handleCopy() {
    const fullText = segments.map(s => s.text).join('\n')
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  async function handleExport(format: 'txt' | 'srt' | 'pdf' | 'zip') {
    try {
      setExporting(true)
      const res = await fetch(`/api/videos/${videoId}/export?format=${format}`)
      if (res.status === 403) {
        alert('PDF export requires Pro plan or above. Upgrade to unlock.')
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
      setExportMenuOpen(false)
    } catch (e) {
      console.error(e)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Embedded player — controlled via the IFrame Player API */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        overflow: 'hidden',
        aspectRatio: '16/9',
      }}>
        <iframe
          ref={iframeRef}
          id={`yt-player-${youtubeId}`}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none', display: 'block' }}
        />
      </div>

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
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search transcript…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '140px',
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

          {/* Copy transcript */}
          <button
            onClick={handleCopy}
            disabled={segments.length === 0}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: copied ? '#4caf50' : 'var(--text-secondary)',
              fontSize: '12px',
              cursor: segments.length === 0 ? 'default' : 'pointer',
              opacity: segments.length === 0 ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : '⧉ Copy transcript'}
          </button>

          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportMenuOpen(o => !o)}
              disabled={segments.length === 0 || exporting}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: segments.length === 0 ? 'default' : 'pointer',
                opacity: segments.length === 0 ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {exporting ? 'Exporting…' : '↓ Export ▾'}
            </button>
            {exportMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '4px',
                minWidth: '180px',
                zIndex: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {([
                  { format: 'txt', label: 'Plain Text (.txt)' },
                  { format: 'srt', label: 'Subtitles (.srt)' },
                  { format: 'pdf', label: 'PDF — Pro+' },
                  { format: 'zip', label: 'All formats (.zip)' },
                ] as const).map(({ format, label }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: format === 'pdf' ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              <button
                key={i}
                onClick={() => seekTo(seg.start)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
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
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
