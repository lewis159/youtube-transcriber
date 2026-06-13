import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getDbUser } from '@/lib/auth'

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const dbUser = await getDbUser(userId)
  const { data: video } = await supabaseAdmin
    .from('videos')
    .select('*, transcripts(*)')
    .eq('id', id)
    .eq('user_id', dbUser.id)
    .single()

  if (!video) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{video.title ?? 'Untitled video'}</h1>
        <p className="text-sm text-muted-foreground">Status: {video.status}</p>
      </div>

      <div className="rounded-lg border p-6 text-sm text-muted-foreground">
        Transcript viewer, notes editor, and export — coming in Phase 1.
      </div>
    </div>
  )
}
