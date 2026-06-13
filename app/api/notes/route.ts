import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { userHasFeature, featureBlockedResponse } from '@/lib/features'

// GET /api/notes?videoId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get('videoId')
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    const { data, error } = await getSupabaseAdmin()
      .from('notes')
      .select('id, body, updated_at')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return NextResponse.json(data ?? { body: '' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// PUT /api/notes — upsert note for a video
export async function PUT(req: Request) {
  try {
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Feature check
    const hasNotesFeature = await userHasFeature(clerkId, 'notes')
    if (!hasNotesFeature) {
      return featureBlockedResponse('notes')
    }

    const { videoId, body } = await req.json()
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

    const { data, error } = await getSupabaseAdmin()
      .from('notes')
      .upsert(
        { video_id: videoId, user_id: user.id, body, updated_at: new Date().toISOString() },
        { onConflict: 'video_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

