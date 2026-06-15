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

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    try {
      setLoading(true)
      const res = await fetch('/api/videos?limit=20')
      if (!res.ok) throw new Error('Failed to load videos')
      setVideos(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUrlError('')
    if (!url.trim()) { setUrlError('Please enter a YouTube URL'); return }

    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (!match) { setUrlError('Could not extract video ID — paste a full YouTube URL'); return }

    try {
      setUploading(true)
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('Upload failed')
      setUrl('')
      await loadVideos()
    } catch (e) {
      console.error(e)
      setUrlError('Failed to add video. Please try again.')
    } finally {
      setUploading(false)
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

  const statusColor = (s: string) => s === 'completed' ? '#4caf50' : s === 'processing' ? 'var(--accent)' : '#666'
  const statusLabel = (s: string) => s === 'completed' ? 'Ready' : s === 'processing' ? 'Processing…' : s === 'pending' ? 'Queued' : 'Error'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

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
            onChange={e => setUrl(e.target.value)}
            disabled={uploading}
            style={{
              flex: 1,
              minWidth: '260px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${urlError ? 'var(--accent)' : 'var(--border-subtle)'}`,
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
        {urlError && (
          <p style={{ color: 'var(--accent)', fontSize: '13px', marginTop: '8px' }}>{urlError}</p>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total videos', value: videos.length },
          { label: 'Ready', value: videos.filter(v => v.status === 'completed').length },
          { label: 'Processing', value: videos.filter(v => v.status === 'processing' || v.status === 'pending').length },
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
                className="glass-card"
                style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}
              >
                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                  alt={video.title}
                  style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
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
                    {video.title}
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
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: statusColor(video.status),
                        display: 'inline-block',
                      }} />
                      {statusLabel(video.status)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
