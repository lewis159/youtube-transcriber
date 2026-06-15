import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const TIERS = ['Starter', 'Pro', 'Studio', 'Enterprise']
const ROLES = ['user', 'org_admin', 'support', 'global_admin']
const STATUSES = ['Active', 'Trial', 'Suspended']

/**
 * PATCH — update an existing user's tier / role / status.
 * Body may contain any subset of { tier, role, status }.
 * Admin-only (global_admin), enforced by requireAdmin().
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { id } = params

  let body: { tier?: unknown; role?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const update: Record<string, string> = {}

  if (body.tier !== undefined) {
    if (typeof body.tier !== 'string' || !TIERS.includes(body.tier)) {
      return NextResponse.json({ error: `Invalid tier` }, { status: 400 })
    }
    update.tier = body.tier
  }
  if (body.role !== undefined) {
    if (typeof body.role !== 'string' || !ROLES.includes(body.role)) {
      return NextResponse.json({ error: `Invalid role` }, { status: 400 })
    }
    update.role = body.role
  }
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status` }, { status: 400 })
    }
    update.status = body.status
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Fetch the current row so we can emit before/after audit snapshots.
  const { data: before } = await supabaseAdmin
    .from('users')
    .select('email, tier, role, status')
    .eq('id', id)
    .single()

  const { data: updated, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('id', id)
    .select('id, email, tier, role, status')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const email = before?.email ?? id

  // Emit a distinct audit row per changed field.
  if (update.tier !== undefined && before?.tier !== update.tier) {
    await logAudit({
      action: 'user_tier_change',
      target: 'user',
      details: `Tier ${before?.tier ?? '—'} → ${update.tier} for ${email}`,
      actorClerkId: userId,
      oldValue: before?.tier,
      newValue: update.tier,
    })
  }
  if (update.role !== undefined && before?.role !== update.role) {
    await logAudit({
      action: 'user_role_change',
      target: 'user',
      details: `Role ${before?.role ?? '—'} → ${update.role} for ${email}`,
      actorClerkId: userId,
      oldValue: before?.role,
      newValue: update.role,
    })
  }
  if (update.status !== undefined && before?.status !== update.status) {
    const suspending = update.status === 'Suspended'
    await logAudit({
      action: suspending ? 'user_suspended' : 'user_unsuspended',
      target: 'user',
      details: `Status ${before?.status ?? '—'} → ${update.status} for ${email}`,
      actorClerkId: userId,
      oldValue: before?.status,
      newValue: update.status,
    })
  }

  return NextResponse.json({ ok: true, user: updated })
}

/**
 * DELETE — remove a user. Deletes the Clerk-backed account when possible,
 * then removes the Supabase row.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { id } = params

  const { data: before } = await supabaseAdmin
    .from('users')
    .select('email, clerk_user_id')
    .eq('id', id)
    .single()

  let clerkDeleted = false
  if (before?.clerk_user_id) {
    try {
      const client = await clerkClient()
      await client.users.deleteUser(before.clerk_user_id)
      clerkDeleted = true
    } catch (err) {
      console.error('[admin/users] Clerk delete failed, removing Supabase row only:', err)
    }
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'user_deleted',
    target: 'user',
    details: `Deleted ${before?.email ?? id}` +
      (clerkDeleted ? ' (Clerk + Supabase)' : ' (Supabase row only)'),
    actorClerkId: userId,
  })

  return NextResponse.json({ ok: true, clerkDeleted })
}
