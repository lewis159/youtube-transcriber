import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { userHasFeature } from '@/lib/features'
import { type TranscriptSegment } from '@/lib/transcript'
import ExportButtons from '@/components/ExportButtons'
import DeleteVideoButton from '@/components/DeleteVideoButton'
import VideoDetailTabs from '@/components/VideoDetailTabs'
import { Badge } from '@/components/ui/badge'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getDbUser(userId)
  const canExportPdf = await userHasFeature(userId, 'export_pdf')

  const { data: video } = await getSupabaseAdmin()
    .from('videos')
    .select('*, transcripts(*), notes(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!video) notFound()

  const transcript = video.transcripts as { content: TranscriptSegment[] } | null
  const noteBody = (video.notes as Array<{ body: string }> | null)?.[0]?.body ?? ''

  return (
    <div className="flex gap-6 -mt-2">
      {/* Left column */}
      <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#888] transition-colors w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dashboard
        </Link>

        <div>
          <h1 className="text-base font-medium text-[#E2E2E8] leading-snug">
            {video.title ?? 'Untitled video'}
          </h1>
          <a
            href={`https://youtube.com/watch?v=${video.youtube_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#555] hover:text-[#378ADD] transition-colors mt-1 inline-block"
          >
            youtube.com/watch?v={video.youtube_id}
          </a>
        </div>

        <div className="bg-[#042C53] border border-[#185FA5] rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}`}
            title={video.title ?? 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={video.status === 'done' ? 'default' : video.status === 'error' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {video.status}
          </Badge>
          <span className="text-xs text-[#555]">
            {new Date(video.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="border-t border-[#2A2A35] pt-4 flex flex-col gap-2">
          <p className="text-xs font-medium text-[#888]">Export</p>
          <ExportButtons videoId={id} canExportPdf={canExportPdf} />
        </div>

        <div className="border-t border-[#2A2A35] pt-3 flex justify-end">
          <DeleteVideoButton videoId={id} />
        </div>
      </div>

      {/* Right column */}
      <div className="flex-1 bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden flex flex-col">
        <VideoDetailTabs
          videoId={id}
          youtubeId={video.youtube_id}
          segments={transcript?.content ?? null}
          initialNote={noteBody}
          status={video.status}
          errorMessage={video.error_message}
        />
      </div>
    </div>
  )
}
