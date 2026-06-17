'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface VideoRecord {
  id: string
  title: string
  youtube_id: string
  status: string
  created_at: string
  thumbnail?: string
}

// Terminal statuses: nothing more will happen, so polling can stop. Everything
// else (legacy pending/processing + Whisper queued/extracting_audio/transcribing)
// is treated as in-flight.
const TERMINAL_STATUSES = new Set(['completed', 'error'])

// In-progress states that should show an animated spinner. Includes the legacy
// 'processing'/'pending' and the new Whisper pipeline states.
const IN_PROGRESS_STATUSES = new Set([
  'pending',
  'processing',
  'queued',
  'extracting_audio',
  'transcribing',
])

// A user-facing form error: a friendly sentence + an optional call-to-action.
type FormError = { message: string; action?: { label: string; href: string } }

// AI model preference: which model powers summaries + Q&A chat for this user.
type AiProvider = 'local' | 'hosted'
type AiSaveState = 'idle' | 'saving' | 'saved' | 'error'

// Turn an upload API failure into a friendly, actionable message — never surface
// raw codes like "upgrade_required" to the user.
function describeUploadError(
  status: number,
  body: { error?: string; feature?: string; limit?: number; used?: number }
): FormError {
  const code = body?.error

  if (status === 403 && code === 'upgrade_required') {
    const FEATURE_LABELS: Record<string, string> = {
      transcribe: 'Transcription',
      export_pdf: 'PDF export',
      stt_fallback: 'Speech-to-text transcription',
      ai_summary: 'AI summaries',
      summary_chat: 'Q&A chat',
    }
    const what = FEATURE_LABELS[body?.feature ?? ''] ?? 'This feature'
    return {
      message: `${what} isn’t included in your current plan.`,
      action: { label: 'View plans', href: '/pricing' },
    }
  }
  if (status === 401) {
    return { message: 'Your session has expired — please refresh and sign in again.' }
  }
  if (status === 429 && code === 'quota_exceeded') {
    const n = typeof body?.limit === 'number' ? body.limit : undefined
    return {
      message: n
        ? `You’ve used all ${n} transcriptions on your plan this month.`
        : 'You’ve used all your transcriptions on your plan this month.',
      action: { label: 'View plans', href: '/pricing' },
    }
  }
  if (status === 429 && code === 'rate_limited') {
    return {
      message: 'You’re doing that a bit too quickly — please wait a moment and try again.',
    }
  }
  if (status === 429) {
    return {
      message: 'You’ve reached your transcription limit for now.',
      action: { label: 'View plans', href: '/pricing' },
    }
  }
  if (status === 400) {
    // The server sends a human-readable message for bad input; codes have no spaces.
    const msg = code && /\s/.test(code) ? code : 'That doesn’t look like a valid YouTube URL.'
    return { message: msg }
  }
  if (status >= 500) {
    return { message: 'Something went wrong on our end. Please try again in a moment.' }
  }
  return { message: 'Couldn’t add that video. Please try again.' }
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [formError, setFormError] = useState<FormError | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  // Per-video retry: which video is mid-retry, and any inline retry error.
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [retryError, setRetryError] = useState<{ id: string; message: string } | null>(null)

  // AI model preference (summaries + Q&A chat). Defaults to 'local'.
  const [aiProvider, setAiProvider] = useState<AiProvider>('local')
  const [aiProviderLoaded, setAiProviderLoaded] = useState(false)
  const [aiSaveState, setAiSaveState] = useState<AiSaveState>('idle')

  useEffect(() => {
    loadVideos()
  }, [])

  // Fetch the current AI-model preference once on mount.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/settings/ai-provider')
        if (!res.ok) throw new Error('Failed to load AI model preference')
        const data = await res.json()
        if (!active) return
        setAiProvider(data?.provider === 'hosted' ? 'hosted' : 'local')
      } catch (e) {
        console.error(e)
      } finally {
        if (active) setAiProviderLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleAiProviderChange(next: AiProvider) {
    if (next === aiProvider || aiSaveState === 'saving') return
    const prev = aiProvider
    // Optimistic update.
    setAiProvider(next)
    setAiSaveState('saving')
    try {
      const res = await fetch('/api/settings/ai-provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: next }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setAiProvider(data?.provider === 'hosted' ? 'hosted' : 'local')
      setAiSaveState('saved')
      setTimeout(() => setAiSaveState((s) => (s === 'saved' ? 'idle' : s)), 1800)
    } catch (e) {
      console.error(e)
      // Roll back the optimistic change.
      setAiProvider(prev)
      setAiSaveState('error')
    }
  }

  // Poll while any video is still being processed, so cards flip
  // Processing → Ready on their own. Stops once nothing is in flight.
  // Non-terminal states include the legacy ones plus the new Whisper
  // pipeline states (queued / extracting_audio / transcribing).
  useEffect(() => {
    const hasPending = videos.some(v => !TERMINAL_STATUSES.has(v.status))
    if (!hasPending) return

    const interval = setInterval(() => {
      loadVideos({ silent: true })
    }, 4000)

    return () => clearInterval(interval)
  }, [videos])

  async function loadVideos({ silent = false }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await fetch('/api/videos?limit=20')
      if (!res.ok) throw new Error('Failed to load videos')
      setVideos(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!url.trim()) { setFormError({ message: 'Please paste a YouTube URL.' }); return }

    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (!match) {
      setFormError({ message: 'That doesn’t look like a YouTube link — paste a full URL like https://youtube.com/watch?v=…' })
      return
    }

    try {
      setUploading(true)
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: url }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setFormError(describeUploadError(res.status, body))
        return
      }
      setUrl('')
      await loadVideos()
    } catch (e) {
      console.error(e)
      setFormError({ message: 'Couldn’t reach the server — check your connection and try again.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(videoId: string) {
    if (!window.confirm('Delete this video?')) return
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await loadVideos()
    } catch (e) {
      console.error(e)
      alert('Failed to delete video. Please try again.')
    }
  }

  // Re-run transcription for an EXISTING video (no new row). The backend resets
  // the same row back to processing/queued; the status poller above then flips
  // the card through to Ready on its own.
  async function handleRetry(videoId: string) {
    setRetryError(null)
    try {
      setRetryingId(videoId)
      const res = await fetch(`/api/videos/${videoId}/retry`, { method: 'POST' })
      if (!res.ok) {
        // 409 = already running; treat as a no-op refresh, anything else is an error.
        if (res.status !== 409) {
          setRetryError({ id: videoId, message: 'Couldn’t restart transcription. Please try again.' })
        }
        return
      }
      // Pull the reset status immediately, then let polling carry it to Ready.
      await loadVideos({ silent: true })
    } catch (e) {
      console.error(e)
      setRetryError({ id: videoId, message: 'Couldn’t reach the server — please try again.' })
    } finally {
      setRetryingId(null)
    }
  }

  async function handleExport(videoId: string, format: 'txt' | 'srt' | 'pdf' | 'zip') {
    try {
      setExportingId(videoId)
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
      setOpenMenuId(null)
    } catch (e) {
      console.error(e)
      alert('Export failed. Please try again.')
    } finally {
      setExportingId(null)
    }
  }

  const statusColor = (s: string) =>
    s === 'completed' ? '#4caf50'
    : s === 'error' ? '#f44336'
    : IN_PROGRESS_STATUSES.has(s) ? 'var(--accent)'
    : '#666'
  const statusLabel = (s: string) => {
    switch (s) {
      case 'completed': return 'Ready'
      case 'error': return 'Error'
      case 'pending': return 'Queued'
      case 'queued': return 'Queued'
      case 'extracting_audio': return 'Extracting audio…'
      case 'transcribing': return 'Transcribing…'
      case 'processing': return 'Processing…'
      default: return s
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Spinner keyframe for in-progress status indicators (scoped here so it
          deletes cleanly with this feature). */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Paste a YouTube link below to get a transcript instantly.
        </p>
      </div>

      {/* Upload form */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '32px',
        backdropFilter: 'var(--card-blur)',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Add a video
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={e => { setUrl(e.target.value); if (formError) setFormError(null) }}
            disabled={uploading}
            aria-invalid={!!formError}
            style={{
              flex: 1,
              minWidth: '260px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${formError ? 'var(--accent)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {uploading ? 'Adding…' : 'Transcribe'}
          </button>
        </form>
        {formError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '12px',
              padding: '12px 14px',
              background: 'var(--accent-subtle, rgba(229,57,53,0.08))',
              border: '1px solid var(--accent-border, rgba(229,57,53,0.3))',
              borderRadius: '8px',
            }}
          >
            <span aria-hidden style={{ fontSize: '15px', lineHeight: 1 }}>⚠️</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', flex: 1, minWidth: '180px' }}>
              {formError.message}
            </span>
            {formError.action && (
              <Link
                href={formError.action.href}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px', whiteSpace: 'nowrap', textDecoration: 'none' }}
              >
                {formError.action.label}
              </Link>
            )}
          </div>
        )}

        {/* AI model preference — controls which model powers summaries + Q&A chat.
            Segmented control: Local (in-house) vs Hosted (Claude). */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI model</span>
              {aiSaveState === 'saving' && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saving…</span>
              )}
              {aiSaveState === 'saved' && (
                <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Saved</span>
              )}
              {aiSaveState === 'error' && (
                <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Couldn’t save — try again</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Local runs on our own engine (private, free). Hosted uses Claude (higher quality, paid).
            </div>
          </div>

          {/* Segmented control */}
          <div
            role="radiogroup"
            aria-label="AI model"
            style={{
              display: 'inline-flex',
              flexShrink: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '3px',
              gap: '3px',
              opacity: aiProviderLoaded ? 1 : 0.6,
            }}
          >
            {([
              { value: 'local' as const, label: 'Local' },
              { value: 'hosted' as const, label: 'Hosted (Claude)' },
            ]).map(({ value, label }) => {
              const active = aiProvider === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!aiProviderLoaded || aiSaveState === 'saving'}
                  onClick={() => handleAiProviderChange(value)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: !aiProviderLoaded || aiSaveState === 'saving' ? 'not-allowed' : 'pointer',
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total videos', value: videos.length },
          { label: 'Ready', value: videos.filter(v => v.status === 'completed').length },
          { label: 'Processing', value: videos.filter(v => IN_PROGRESS_STATUSES.has(v.status)).length },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Video list */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Your videos</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : videos.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '64px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No videos yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Paste a YouTube URL above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {videos.map(video => (
              <div
                key={video.id}
                className="glass-card mobile-video-row"
                style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}
              >
                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                  alt={video.title}
                  style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <Link
                    href={`/video/${video.id}`}
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '6px',
                    }}
                  >
                    {video.title || video.youtube_id}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: statusColor(video.status),
                      fontWeight: 600,
                    }}>
                      {IN_PROGRESS_STATUSES.has(video.status) ? (
                        <span
                          aria-hidden
                          style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            border: '2px solid var(--accent-border, rgba(229,57,53,0.3))',
                            borderTopColor: statusColor(video.status),
                            display: 'inline-block',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                      ) : (
                        <span style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: statusColor(video.status),
                          display: 'inline-block',
                        }} />
                      )}
                      {statusLabel(video.status)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {retryError?.id === video.id && (
                    <div role="alert" style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent)' }}>
                      {retryError.message}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mobile-video-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <a
                    href={`https://youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    title="Watch on YouTube"
                  >
                    ▶ Watch
                  </a>

                  {/* Retry — re-run transcription for this same video. Shown only
                      for terminal states (error = recovery, completed = re-run). */}
                  {(video.status === 'error' || video.status === 'completed') && (
                    <button
                      onClick={() => handleRetry(video.id)}
                      disabled={retryingId === video.id}
                      title={video.status === 'error' ? 'Retry transcription' : 'Re-run transcription'}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: video.status === 'error' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                        border: `1px solid ${video.status === 'error' ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                        color: video.status === 'error' ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: retryingId === video.id ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {retryingId === video.id ? 'Retrying…' : '↻ Retry'}
                    </button>
                  )}

                  {/* Export dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === video.id ? null : video.id)}
                      disabled={video.status !== 'completed' || exportingId === video.id}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: video.status === 'completed' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                        border: `1px solid ${video.status === 'completed' ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                        color: video.status === 'completed' ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: '13px',
                        cursor: video.status === 'completed' ? 'pointer' : 'not-allowed',
                        fontWeight: 600,
                      }}
                    >
                      {exportingId === video.id ? 'Exporting…' : '↓ Export ▾'}
                    </button>

                    {openMenuId === video.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 4px)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        padding: '6px',
                        minWidth: '140px',
                        zIndex: 50,
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
                            onClick={() => handleExport(video.id, format)}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 12px',
                              fontSize: '13px',
                              color: format === 'pdf' ? 'var(--text-muted)' : 'var(--text-primary)',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(video.id)}
                    title="Delete video"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: '#e57373',
                      fontSize: '13px',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
