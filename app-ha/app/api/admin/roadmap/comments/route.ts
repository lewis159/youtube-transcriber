import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { revalidateTag } from 'next/cache'
import { supabaseAdmin, getSupabaseUserId } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ALLOWED_KINDS = ['update', 'status_change', 'system'] as const
type Kind = typeof ALLOWED_KINDS[number]

const MAX_BODY = 4000

// Map a joined comment row → the client-facing shape (matches RoadmapComment).
function mapComment(row: any) {
  const author = Array.isArray(row.author) ? row.author[0] : row.author
  return {
    id: row.id,
    itemKey: row.item_key,
    body: row.body,
    kind: row.kind,
    authorName: author?.full_name || author?.email || 'system',
    createdAt: row.created_at ?? '',
  }
}

// GET — admin-only. ?itemKey= returns that item's comments (oldest first).
export async function GET(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const itemKeyRaw = req.nextUrl.searchParams.get('itemKey')
  const itemKey = Number(itemKeyRaw)
  if (!itemKeyRaw || !Number.isInteger(itemKey)) {
    return NextResponse.json({ error: 'itemKey is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('roadmap_comments')
    .select('id, item_key, body, kind, created_at, author:author_user_id(full_name, email)')
    .eq('item_key', itemKey)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: (data ?? []).map(mapComment) })
}

// POST — admin-only. Adds an update to an item's thread.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { itemKey, body, kind } = await req.json()

  if (typeof itemKey !== 'number' || !Number.isInteger(itemKey)) {
    return NextResponse.json({ error: 'itemKey must be a number' }, { status: 400 })
  }

  if (typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 })
  }

  const trimmed = body.trim()
  if (trimmed.length > MAX_BODY) {
    return NextResponse.json({ error: `Body must be ${MAX_BODY} characters or fewer` }, { status: 400 })
  }

  const knd: Kind = ALLOWED_KINDS.includes(kind as Kind) ? (kind as Kind) : 'update'

  // The item must exist (item_key is the FK target).
  const { data: item } = await supabaseAdmin
    .from('roadmap_items')
    .select('item_key')
    .eq('item_key', itemKey)
    .maybeSingle()
  if (!item) {
    return NextResponse.json({ error: 'Roadmap item not found' }, { status: 404 })
  }

  // Resolve the admin's public.users.id from their Clerk id (best-effort).
  let authorUserId: string | null = null
  if (userId) {
    try {
      authorUserId = await getSupabaseUserId(userId)
    } catch {
      authorUserId = null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('roadmap_comments')
    .insert({ item_key: itemKey, body: trimmed, kind: knd, author_user_id: authorUserId })
    .select('id, item_key, body, kind, created_at, author:author_user_id(full_name, email)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'roadmap_comment_add',
    target: 'roadmap_item',
    details: `#${itemKey}: ${trimmed.slice(0, 120)}`,
    actorClerkId: userId,
  })

  revalidateTag('roadmap-comments')

  return NextResponse.json({ success: true, comment: mapComment(data) })
}

// DELETE — admin-only. ?id= removes a single comment.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Read item_key first for the audit detail.
  const { data: existing } = await supabaseAdmin
    .from('roadmap_comments')
    .select('item_key')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin
    .from('roadmap_comments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'roadmap_comment_delete',
    target: 'roadmap_item',
    details: existing?.item_key ? `#${existing.item_key}` : id,
    actorClerkId: userId,
  })

  revalidateTag('roadmap-comments')

  return NextResponse.json({ success: true })
}
