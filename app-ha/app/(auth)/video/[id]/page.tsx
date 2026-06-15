import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getVideoByIdAndUser, getVideoTranscript } from '@/lib/supabase'
import TranscriptViewer from './TranscriptViewer'

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let video: any
  try {
    video = await getVideoByIdAndUser(id, userId)
  } catch {
    redirect('/dashboard')
  }

  if (!video) redirect('/dashboard')

  let transcript: { content: { text: string; start: number; duration: number }[]; language?: string } | null = null
  if (video.status === 'completed') {
    try {
      transcript = await getVideoTranscript(id)
    } catch {
      transcript = null
    }
  }

  const segments = transcript?.content ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <Link href="/dashboard" style={{ color: '#E53935', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</span>
      </div>

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
          </div>
        </div>
      </div>

      {video.status !== 'completed' ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Processing…
          </div>
          <div style={{ fontSize: '13px' }}>
            Your transcript is being generated. Check back in a moment.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '16/9',
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none', display: 'block' }}
              />
            </div>

            <TranscriptViewer segments={segments} youtubeId={video.youtube_id} />
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Video Info</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> {video.status}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Segments:</span> {segments.length}</div>
              {transcript?.language && (
                <div><span style={{ color: 'var(--text-secondary)' }}>Language:</span> {transcript.language.toUpperCase()}</div>
              )}
              <div><span style={{ color: 'var(--text-secondary)' }}>Added:</span> {new Date(video.created_at).toLocaleDateString()}</div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
