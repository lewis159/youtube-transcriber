import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
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

  let user: Awaited<ReturnType<typeof getDbUser>> | null = null
  let dbError: string | null = null
  try {
    user = await getDbUser(userId)
  } catch (e: unknown) {
    const asAny = e as Record<string, unknown>
    const code = asAny?.code ?? ''
    const msg = (e instanceof Error ? e.message : '') + JSON.stringify(e)
    if (code === 'PGRST205' || msg.includes('PGRST205') || msg.includes('schema cache')) {
      dbError = 'Database schema not yet applied. Please run supabase/schema.sql in your Supabase SQL Editor.'
    } else if (code === 'PGRST116' || msg.includes('PGRST116') || msg.includes('0 rows')) {
      dbError = 'Your account is being set up — the Clerk webhook may not have fired yet. Please wait a moment and refresh.'
    } else {
      dbError = 'Could not load your profile. Please try again shortly.'
    }
  }

  if (dbError || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 max-w-lg">
          <p className="text-sm font-medium text-[#E04B4A] mb-2">Setup required</p>
          <p className="text-sm text-[#888]">{dbError ?? 'Your account is being set up. Please refresh in a moment.'}</p>
        </div>
      </div>
    )
  }

  const totalCredits = (user.subscription_credits ?? 0) + (user.purchased_credits ?? 0)

  const { data: videos } = await getSupabaseAdmin()
    .from('videos')
    .select('id, youtube_id, title, thumbnail, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const videoList = (videos ?? []) as Video[]

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg px-4 py-3">
          <p className="text-2xl font-medium text-[#85B7EB]">{videoList.length}</p>
          <p className="text-xs text-[#555] mt-0.5">Videos saved</p>
        </div>
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg px-4 py-3">
          <p className="text-2xl font-medium text-[#85B7EB]">{totalCredits}</p>
          <p className="text-xs text-[#555] mt-0.5">Credits remaining</p>
        </div>
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg px-4 py-3 capitalize">
          <p className="text-2xl font-medium text-[#85B7EB]">{user.tier}</p>
          <p className="text-xs text-[#555] mt-0.5">Current plan</p>
        </div>
      </div>

      {/* Submit */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-[#E2E2E8]">Transcribe a YouTube video</p>
        <VideoSubmitForm />
      </div>

      {/* Video grid */}
      {videoList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#2A2A35] p-12 text-center text-[#555]">
          No videos yet &mdash; paste a YouTube URL above to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#888]">Recent videos</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videoList.map((v) => (
              <Link
                key={v.id}
                href={`/video/${v.id}`}
                className="group bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden hover:border-[#185FA5] transition-colors"
              >
                {v.thumbnail ? (
                  <img
                    src={v.thumbnail}
                    alt={v.title ?? ''}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-[#042C53] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                )}
                <div className="p-3 flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-[#E2E2E8] leading-tight line-clamp-2 group-hover:text-[#85B7EB] transition-colors">
                    {v.title ?? 'Processing…'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={v.status === 'done' ? 'default' : v.status === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {v.status}
                    </Badge>
                    <span className="text-xs text-[#555]">
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
