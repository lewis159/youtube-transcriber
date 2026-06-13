import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import VideoSubmitForm from '@/components/VideoSubmitForm'
import { Badge } from '@/components/ui/badge'

type Video = {
  id: string
  youtube_id: string
  title: string | null
  thumbnail: string | null
  status: string
  created_at: string
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await getDbUser(userId)
  const totalCredits = (user.subscription_credits ?? 0) + (user.purchased_credits ?? 0)

  const { data: videos } = await getSupabaseAdmin()
    .from('videos')
    .select('id, youtube_id, title, thumbnail, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const videoList = (videos ?? []) as Video[]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            {user.tier} &middot; {totalCredits} credit{totalCredits !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-6 flex flex-col gap-4">
        <p className="font-medium">Transcribe a YouTube video</p>
        <VideoSubmitForm />
      </div>

      {videoList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No videos yet &mdash; paste a YouTube URL above to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold mb-2">Your videos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videoList.map((v) => (
              <Link key={v.id} href={`/video/${v.id}`} className="group rounded-lg border p-3 flex gap-3 hover:bg-muted/50 transition-colors">
                {v.thumbnail && (
                  <Image
                    src={v.thumbnail}
                    alt={v.title ?? ''}
                    width={96}
                    height={54}
                    className="rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary">
                    {v.title ?? 'Processing...'}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Badge variant={v.status === 'done' ? 'default' : v.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                      {v.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
