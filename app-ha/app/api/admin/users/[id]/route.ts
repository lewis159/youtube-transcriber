import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const TIERS = ['Starter', 'Pro', 'Studio', 'Enterprise']
const ROLES = ['user', 'org_admin', 'support', 'global_admin']
// Status is derived from the users.is_trial boolean — no Suspended column exists.
const STATUSES = ['Active', 'Trial']

/**
 * First day of the CURRENT calendar month (UTC) as a YYYY-MM-DD string. This
 * is the `period_month` a new grant carries so it applies to THIS month only.
 */
function currentPeriodMonth(): string {
  const now = new Date()
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return first.toISOString().slice(0, 10)
}

/**
 * PATCH — update an existing user's tier / role / status, and/or grant extra
 * transcriptions FOR THE CURRENT MONTH.
 *
 * Body may contain any subset of:
 *   { tier, role, status }              — existing field edits
 *   { grantAmount: number, reason? }    — grant this many extra transcriptions
 *                                          for the CURRENT calendar month
 *                                          (negative = correction; both are
 *                                          recorded as immutable grant rows)
 *
 * `grantAmount` is the support/compensation lever: it inserts a row in
 * transcription_grants for the current `period_month`, which raises the user's
 * effective monthly limit (tier_limit + SUM(grants this month)) WITHOUT
 * changing their tier. Grants are ONE-TIME — they expire automatically at month
 * rollover. Corrections are recorded as negative-amount rows (never by mutating
 * or deleting prior grants), preserving a full audit trail. Admin-only
 * (global_admin), enforced by requireAdmin(). Every change is audited via
 * logAudit().
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { id } = params

  let body: { tier?: unknown; role?: unknown; status?: unknown; grantAmount?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // NOTE: the `users` table stores tier (lowercase) and role columns, plus an
  // `is_trial` boolean. There is NO `status` column — status is derived from
  // is_trial. So a `status` change is translated into an is_trial write here.
  const update: Record<string, unknown> = {}

  if (body.tier !== undefined) {
    if (typeof body.tier !== 'string' || !TIERS.includes(body.tier)) {
      return NextResponse.json({ error: `Invalid tier` }, { status: 400 })
    }
    // UI sends display labels (Starter/Pro/…); the column is lowercase.
    update.tier = body.tier.toLowerCase()
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
    // Map status → is_trial (no Suspended state exists in the schema).
    update.is_trial = body.status === 'Trial'
  }

  // grantAmount: grant (or correct, if negative) extra transcriptions for the
  // CURRENT calendar month. Recorded as an immutable transcription_grants row.
  let grantAmount: number | undefined
  if (body.grantAmount !== undefined) {
    if (typeof body.grantAmount !== 'number' || !Number.isFinite(body.grantAmount) || !Number.isInteger(body.grantAmount)) {
      return NextResponse.json({ error: 'grantAmount must be a whole number' }, { status: 400 })
    }
    if (body.grantAmount === 0) {
      return NextResponse.json({ error: 'grantAmount must be non-zero' }, { status: 400 })
    }
    grantAmount = body.grantAmount
  }

  if (body.reason !== undefined && typeof body.reason !== 'string') {
    return NextResponse.json({ error: 'reason must be a string' }, { status: 400 })
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

  if (Object.keys(update).length === 0 && grantAmount === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Fetch the current row so we can emit before/after audit snapshots.
  const { data: before } = await supabaseAdmin
    .from('users')
    .select('email, tier, role, is_trial')
    .eq('id', id)
    .single()

  // Apply the tier/role/status field edits (if any). When only a grant is being
  // made there is nothing to UPDATE, so skip the call entirely.
  let updated: { id: string; email: string; tier: string; role: string; is_trial: boolean } | null = null
  if (Object.keys(update).length > 0) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, email, tier, role, is_trial')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    updated = data
  }

  const email = before?.email ?? id

  // Insert the current-month grant row (if requested). The grant applies only
  // to this calendar month (period_month) and expires at rollover — it is NOT a
  // permanent bump. Corrections are recorded as negative-amount rows, never by
  // mutating/deleting prior grants. granted_by = acting admin's public.users.id.
  let monthTotal: number | undefined
  if (grantAmount !== undefined) {
    const period = currentPeriodMonth()

    // Resolve the acting admin's public.users.id (uuid) from their Clerk id, to
    // record who granted it. Best-effort: a null is fine if it can't resolve.
    let grantedBy: string | null = null
    if (userId) {
      const { data: adminRow } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()
      grantedBy = adminRow?.id ?? null
    }

    const { error: grantErr } = await supabaseAdmin
      .from('transcription_grants')
      .insert({
        user_id: id,
        amount: grantAmount,
        period_month: period,
        reason: reason || null,
        granted_by: grantedBy,
      })

    if (grantErr) {
      return NextResponse.json({ error: grantErr.message }, { status: 500 })
    }

    // Recompute this user's net granted total for the current month so the UI
    // can reflect the authoritative figure (corrections included).
    const { data: monthRows } = await supabaseAdmin
      .from('transcription_grants')
      .select('amount')
      .eq('user_id', id)
      .eq('period_month', period)
    monthTotal = (monthRows ?? []).reduce(
      (sum, row) => sum + (typeof row.amount === 'number' ? row.amount : 0),
      0
    )
  }

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
  if (update.is_trial !== undefined && before?.is_trial !== update.is_trial) {
    const beforeStatus = before?.is_trial ? 'Trial' : 'Active'
    const afterStatus = update.is_trial ? 'Trial' : 'Active'
    await logAudit({
      action: 'user_status_change',
      target: 'user',
      details: `Status ${beforeStatus} → ${afterStatus} for ${email}`,
      actorClerkId: userId,
      oldValue: beforeStatus,
      newValue: afterStatus,
    })
  }
  if (grantAmount !== undefined) {
    const sign = grantAmount > 0 ? '+' : ''
    const period = currentPeriodMonth()
    await logAudit({
      action: 'user_transcription_grant',
      target: 'user',
      details: `Granted ${sign}${grantAmount} transcription(s) for ${period.slice(0, 7)} to ${email} ` +
        `(month total now ${monthTotal ?? grantAmount})` +
        (reason ? ` — ${reason}` : ''),
      actorClerkId: userId,
      oldValue: null,
      newValue: grantAmount,
    })
  }

  // Return the authoritative figures the UI needs: updated user fields (if any
  // were changed) and the user's net granted total for the current month.
  return NextResponse.json({
    ok: true,
    user: updated,
    monthGrantTotal: monthTotal,
  })
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
