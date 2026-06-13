import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { extractVideoId, fetchVideoMeta } from '@/lib/youtube'
import { fetchTranscript } from '@/lib/transcript'

// GET /api/videos — list all videos for the current user
export async function GET() {
  try {
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('id, youtube_id, title, thumbnail, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// POST /api/videos — submit a YouTube URL, fetch metadata + transcript
export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Credit check
    const totalCredits = user.subscription_credits + user.purchased_credits
    if (user.tier === 'explorer' && totalCredits <= 0) {
      return NextResponse.json({ error: 'no_credits', message: 'You have used all your free videos. Upgrade to continue.' }, { status: 402 })
    }
    if (user.tier !== 'explorer' && totalCredits <= 0) {
      return NextResponse.json({ error: 'no_credits', message: 'No credits remaining. Top up or wait for your monthly reset.' }, { status: 402 })
    }

    const body = await req.json()
    const videoId = extractVideoId(body.url ?? '')
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('videos')
      .select('id')
      .eq('user_id', user.id)
      .eq('youtube_id', videoId)
      .single()
    if (existing) {
      return NextResponse.json({ error: 'already_exists', id: existing.id }, { status: 409 })
    }

    // Create video record
    const { data: video, error: insertErr } = await supabaseAdmin
      .from('videos')
      .insert({ user_id: user.id, youtube_id: videoId, status: 'processing' })
      .select()
      .single()
    if (insertErr) throw insertErr

    // Fetch metadata + transcript (fail gracefully)
    try {
      const [meta, segments] = await Promise.all([
        fetchVideoMeta(videoId),
        fetchTranscript(videoId),
      ])

      await supabaseAdmin
        .from('videos')
        .update({ title: meta.title, thumbnail: meta.thumbnail, status: 'done' })
        .eq('id', video.id)

      await supabaseAdmin
        .from('transcripts')
        .insert({ video_id: video.id, content: segments, language: 'en' })

      // Deduct credit
      if (user.purchased_credits > 0) {
        await supabaseAdmin.from('users').update({ purchased_credits: user.purchased_credits - 1 }).eq('id', user.id)
      } else {
        await supabaseAdmin.from('users').update({ subscription_credits: user.subscription_credits - 1 }).eq('id', user.id)
      }

      return NextResponse.json({ id: video.id, title: meta.title, status: 'done' }, { status: 201 })
    } catch (fetchErr) {
      await supabaseAdmin.from('videos').update({ status: 'error', error_message: String(fetchErr) }).eq('id', video.id)
      return NextResponse.json({ error: 'transcript_failed', id: video.id, message: String(fetchErr) }, { status: 422 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
