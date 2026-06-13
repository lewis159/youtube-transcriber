import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET /api/videos/[id] — fetch a single video with its transcript and notes
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    const { data, error } = await getSupabaseAdmin()
      .from('videos')
      .select('*, transcripts(*), notes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// DELETE /api/videos/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    const { error } = await getSupabaseAdmin()
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return new Response(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
