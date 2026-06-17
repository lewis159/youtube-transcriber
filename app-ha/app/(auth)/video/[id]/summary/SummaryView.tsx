'use client'

// ── AI Summary view (client) — additive, Phase 4 ─────────────────────────────
// Renders: embedded player (seekable), AI summary + key points, clickable
// chapters that seek the player, full searchable transcript (timestamps seek
// too), a branded summary-PDF export, and the Q&A chat. All gated bits are
// inert/hidden when their flag is OFF (flags resolved server-side by page.tsx).

import { useCallback, useEffect, useRef, useState } from 'react'
import { seekYouTube, timestampToSeconds } from '@/lib/youtube-seek'
import SummaryChat from './SummaryChat'

interface Segment {
  text: string
  start: number
  duration: number
}

interface SummaryData {
  summary: string
  keyPoints: string[]
  chapters: { title: string; timestamp: string }[]
  model?: string | null
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

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: '12px',
  overflow: 'hidden',
}

export default function SummaryView({
  videoId,
  youtubeId,
  title,
  segments,
  aiSummaryEnabled,
  chatEnabled,
}: {
  videoId: string
  youtubeId: string
  title: string
  segments: Segment[]
  aiSummaryEnabled: boolean
  chatEnabled: boolean
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  // Seek the embedded iframe via the postMessage helper.
  const seek = useCallback((seconds: number) => {
    seekYouTube(iframeRef.current, seconds)
  }, [])

  // Fetch the cached summary on mount (only when the feature is enabled).
  useEffect(() => {
    let cancelled = false
    if (!aiSummaryEnabled) {
      setLoadingSummary(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/summary`)
        if (cancelled) return
        if (res.ok) {
          setSummary(await res.json())
        } else if (res.status === 404) {
          setSummary(null) // not generated yet
        } else if (res.status === 403) {
          setSummary(null)
        }
      } catch {
        /* ignore — show generate button */
      } finally {
        if (!cancelled) setLoadingSummary(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [videoId, aiSummaryEnabled])

  async function generateSummary() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/videos/${videoId}/summary`, { method: 'POST' })
      if (res.status === 413) {
        setError('This transcript is too long to summarise.')
        return
      }
      if (res.status === 403) {
        setError('AI summaries require a plan upgrade.')
        return
      }
      if (!res.ok) throw new Error('Failed to generate summary')
      setSummary(await res.json())
    } catch (e) {
      console.error(e)
      setError('Could not generate the summary. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function exportSummaryPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/export?format=summary-pdf`)
      if (res.status === 403) {
        alert('Summary PDF export requires a plan upgrade.')
        return
      }
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `summary-${youtubeId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error(e)
      alert('Could not export the summary PDF. Please try again.')
    } finally {
      setExportingPdf(false)
    }
  }

  const filtered = search
    ? segments.filter((s) => s.text.toLowerCase().includes(search.toLowerCase()))
    : segments

  return (
    <div
      className="mobile-single-col"
      style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}
    >
      {/* LEFT: player + summary + chapters + transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Embedded, seekable player */}
        <div style={{ ...cardStyle, aspectRatio: '16/9' }}>
          <iframe
            ref={iframeRef}
            id={`yt-summary-player-${youtubeId}`}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${
              typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''
            }`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none', display: 'block' }}
          />
        </div>

        {/* Summary + key points */}
        <div style={cardStyle}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700 }}>AI Summary</div>
            {summary && aiSummaryEnabled && (
              <button
                onClick={exportSummaryPdf}
                disabled={exportingPdf}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: exportingPdf ? 'default' : 'pointer',
                  opacity: exportingPdf ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {exportingPdf ? 'Exporting…' : '↓ Summary PDF'}
              </button>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            {!aiSummaryEnabled ? (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                AI summaries are not available on your current plan. Upgrade to unlock automatic
                summaries, key points, and chapters.
              </div>
            ) : loadingSummary ? (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading summary…</div>
            ) : !summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  No summary yet. Generate an AI summary, key points, and chapters for this video.
                </div>
                {error && <div style={{ fontSize: '13px', color: '#E53935' }}>{error}</div>}
                <button
                  onClick={generateSummary}
                  disabled={generating}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: '#E53935',
                    border: 'none',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: generating ? 'default' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                  }}
                >
                  {generating ? 'Generating…' : '✨ Generate summary'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {summary.summary && (
                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {summary.summary}
                  </p>
                )}

                {summary.keyPoints.length > 0 && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                      Key points
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {summary.keyPoints.map((p, i) => (
                        <li key={i} style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chapters — clickable, seek the player */}
        {aiSummaryEnabled && summary && summary.chapters.length > 0 && (
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: '15px', fontWeight: 700 }}>
              Chapters
            </div>
            <div style={{ padding: '8px' }}>
              {summary.chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => seek(timestampToSeconds(ch.timestamp))}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    width: '100%',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#E53935',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      minWidth: '54px',
                    }}
                  >
                    {ch.timestamp}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ch.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full searchable transcript — timestamps seek the player too */}
        <div style={cardStyle}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search transcript…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          </div>

          <div style={{ maxHeight: '480px', overflowY: 'auto', padding: '8px' }}>
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
                  onClick={() => seek(seg.start)}
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#E53935',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      marginTop: '2px',
                      minWidth: '36px',
                    }}
                  >
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
      </div>

      {/* RIGHT: Q&A chat (only when enabled) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {chatEnabled ? (
          <SummaryChat videoId={videoId} />
        ) : (
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Ask about this video</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Q&amp;A chat is not available on your current plan. Upgrade to ask questions about this
              video and get answers from the transcript.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
