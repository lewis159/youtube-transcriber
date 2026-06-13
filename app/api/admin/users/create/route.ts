import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/admin/users/create - admin creates a user (Clerk webhook will handle sync in production)
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existing } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Create organization for the user
    const { data: org, error: orgError } = await getSupabaseAdmin()
      .from('organizations')
      .insert({ name: `${email}'s Workspace`, slug: `${email.split('@')[0]}-${Date.now()}` })
      .select()
      .single()

    if (orgError) throw orgError

    // Create user (will normally be done via Clerk webhook, but admin can create manually)
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('users')
      .insert({
        email,
        organization_id: org.id,
        tier: 'explorer',
        role: 'user',
        subscription_credits: 3,
        purchased_credits: 0,
        clerk_user_id: `admin-created-${Date.now()}`, // Placeholder until Clerk sync
      })
      .select()
      .single()

    if (userError) throw userError

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
