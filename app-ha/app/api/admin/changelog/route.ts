import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const DEFAULT_BORDER = '#2a2a2a'

// Coerce an arbitrary value into a clean string[] (drops empties).
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0)
}

// If this entry becomes the single current one, clear is_current on all others.
async function clearOtherCurrent(exceptId: string | null) {
  let q = supabaseAdmin.from('changelog_entries').update({ is_current: false }).eq('is_current', true)
  if (exceptId) q = q.neq('id', exceptId)
  await q
}

// Lowest sort_order in the table (newest entries sort lowest). Returns null if empty.
async function minSortOrder(): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('changelog_entries')
    .select('sort_order')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.sort_order ?? null
}

// POST — create a new changelog entry.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const body = await req.json().catch(() => ({}))

  const version = typeof body.version === 'string' ? body.version.trim() : ''
  if (!version) {
    return NextResponse.json({ error: 'Version is required' }, { status: 400 })
  }

  const isCurrent = body.isCurrent === true
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null
  const date = typeof body.date === 'string' && body.date.trim() ? body.date.trim() : null
  const borderColor =
    typeof body.borderColor === 'string' && body.borderColor.trim()
      ? body.borderColor.trim()
      : DEFAULT_BORDER

  // New current entries go to the top (min - 1); others default to the same.
  const min = await minSortOrder()
  const sortOrder =
    typeof body.sortOrder === 'number' ? body.sortOrder : min !== null ? min - 1 : 0

  if (isCurrent) {
    await clearOtherCurrent(null)
  }

  const { data, error } = await supabaseAdmin
    .from('changelog_entries')
    .insert({
      version,
      label,
      date,
      is_current: isCurrent,
      border_color: borderColor,
      new_features: toStringArray(body.newFeatures),
      changes: toStringArray(body.changes),
      removed: toStringArray(body.removed),
      sort_order: sortOrder,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'changelog_create',
    target: 'changelog_entry',
    details: `Created changelog entry ${version}${isCurrent ? ' (current)' : ''}`,
    actorClerkId: userId,
    newValue: { id: data.id, version, isCurrent },
  })

  revalidateTag('changelog')
  return NextResponse.json({ success: true, id: data.id })
}

// PATCH — edit an existing entry. Requires `id` in the body.
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const body = await req.json().catch(() => ({}))

  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) {
    return NextResponse.json({ error: 'Entry id is required' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (typeof body.version === 'string') {
    const v = body.version.trim()
    if (!v) return NextResponse.json({ error: 'Version cannot be empty' }, { status: 400 })
    update.version = v
  }
  if ('label' in body) update.label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null
  if ('date' in body) update.date = typeof body.date === 'string' && body.date.trim() ? body.date.trim() : null
  if ('borderColor' in body)
    update.border_color =
      typeof body.borderColor === 'string' && body.borderColor.trim() ? body.borderColor.trim() : DEFAULT_BORDER
  if ('newFeatures' in body) update.new_features = toStringArray(body.newFeatures)
  if ('changes' in body) update.changes = toStringArray(body.changes)
  if ('removed' in body) update.removed = toStringArray(body.removed)
  if (typeof body.sortOrder === 'number') update.sort_order = body.sortOrder

  const makingCurrent = body.isCurrent === true
  if ('isCurrent' in body) update.is_current = body.isCurrent === true

  if (makingCurrent) {
    // Clear current on every other entry first, then set this one below.
    await clearOtherCurrent(id)
  }

  const { error } = await supabaseAdmin.from('changelog_entries').update(update).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'changelog_update',
    target: 'changelog_entry',
    details: `Edited changelog entry ${typeof update.version === 'string' ? update.version : id}`,
    actorClerkId: userId,
    newValue: { id, ...update },
  })

  revalidateTag('changelog')
  return NextResponse.json({ success: true })
}

// DELETE — remove an entry. Accepts `?id=` or `{ id }` in the body.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const url = new URL(req.url)
  let id = url.searchParams.get('id') ?? ''
  if (!id) {
    const body = await req.json().catch(() => ({}))
    id = typeof body.id === 'string' ? body.id : ''
  }
  if (!id) {
    return NextResponse.json({ error: 'Entry id is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('changelog_entries').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'changelog_delete',
    target: 'changelog_entry',
    details: `Deleted changelog entry ${id}`,
    actorClerkId: userId,
    oldValue: { id },
  })

  revalidateTag('changelog')
  return NextResponse.json({ success: true })
}
