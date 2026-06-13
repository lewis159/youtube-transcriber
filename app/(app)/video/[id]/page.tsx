import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { userHasFeature } from '@/lib/features'
import { formatTimestamp, type TranscriptSegment } from '@/lib/transcript'
import NoteEditor from '@/components/NoteEditor'
import ExportButtons from '@/components/ExportButtons'
import DeleteVideoButton from '@/components/DeleteVideoButton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getDbUser(userId)
  const canExportPdf = await userHasFeature(userId, 'export_pdf')

  const { data: video } = await supabaseAdmin
    .from('videos')
    .select('*, transcripts(*), notes(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!video) notFound()

  const transcript = video.transcripts as { content: TranscriptSegment[] } | null
  const noteBody = (video.notes as Array<{ body: string }> | null)?.[0]?.body ?? ''

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold leading-tight">{video.title ?? 'Untitled video'}</h1>
          <Badge variant={video.status === 'done' ? 'default' : video.status === 'error' ? 'destructive' : 'secondary'}>
            {video.status}
          </Badge>
        </div>
        <a
          href={`https://youtube.com/watch?v=${video.youtube_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:underline"
        >
          youtube.com/watch?v={video.youtube_id}
        </a>
      </div>

      <div className="aspect-video w-full max-w-2xl rounded-lg overflow-hidden border">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}`}
          title={video.title ?? 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <ExportButtons videoId={id} canExportPdf={canExportPdf} />

      <Separator />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transcript */}
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Transcript</h2>
          {video.status === 'error' && (
            <p className="text-sm text-destructive">{video.error_message ?? 'Transcript failed to load.'}</p>
          )}
          {video.status === 'processing' && (
            <p className="text-sm text-muted-foreground">Processing…</p>
          )}
          {transcript ? (
            <ScrollArea className="h-[480px] rounded-md border p-4">
              <div className="flex flex-col gap-3 text-sm">
                {transcript.content.map((seg, i) => (
                  <div key={i} className="flex gap-3">
                    <a
                      href={`https://youtube.com/watch?v=${video.youtube_id}&t=${Math.floor(seg.start)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground font-mono w-12 flex-shrink-0 hover:text-primary pt-0.5"
                    >
                      {formatTimestamp(seg.start)}
                    </a>
                    <p className="leading-relaxed">{seg.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-[480px] rounded-md border flex items-center justify-center text-muted-foreground text-sm">
              No transcript available.
            </div>
          )}
        </div>

        {/* Notes */}
        <NoteEditor videoId={id} initialBody={noteBody} />
      </div>

      <Separator />

      <DeleteVideoButton videoId={id} />
    </div>
  )
}
