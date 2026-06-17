// ── AI Summary view — additive, Phase 4 ──────────────────────────────────────
// Isolated route (deletes cleanly). Server component: Clerk auth, ownership,
// feature-flag resolution (ai_summary / summary_chat, both default OFF), then
// hands off to the client SummaryView. Features are inert/hidden when flags off.

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getVideoByIdAndUser, getVideoTranscript } from '@/lib/supabase'
import { checkUserFeature } from '@/lib/feature-flags'
import SummaryView from './SummaryView'

export const dynamic = 'force-dynamic'

export default async function VideoSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  // Resolve flags server-side so the client never renders gated UI it can't use.
  const [aiSummaryEnabled, chatEnabled] = await Promise.all([
    checkUserFeature(userId, 'ai_summary'),
    checkUserFeature(userId, 'summary_chat'),
  ])

  let transcript: {
    content: { text: string; start: number; duration: number }[]
    language?: string
  } | null = null
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <Link href="/dashboard" style={{ color: '#E53935', textDecoration: 'none' }}>
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/video/${id}`}
          style={{ color: '#E53935', textDecoration: 'none' }}
        >
          {video.title}
        </Link>
        <span>/</span>
        <span>AI Summary</span>
      </div>

      {video.status !== 'completed' ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px',
              color: 'var(--text-primary)',
            }}
          >
            Transcript not ready
          </div>
          <div style={{ fontSize: '13px' }}>
            An AI summary becomes available once this video has finished transcribing.
          </div>
        </div>
      ) : (
        <SummaryView
          videoId={id}
          youtubeId={video.youtube_id}
          title={video.title}
          segments={segments}
          aiSummaryEnabled={aiSummaryEnabled}
          chatEnabled={chatEnabled}
        />
      )}
    </div>
  )
}
