import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET /api/organizations/[id]/members - list org members
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Check access
    const isOrgAdmin = user.role === 'org_admin' && user.organization_id === id
    const isAdmin = user.role === 'administrator'
    if (!isOrgAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await getSupabaseAdmin()
      .from('users')
      .select('id, email, tier, role, created_at')
      .eq('organization_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// POST /api/organizations/[id]/members - add member to org (admin or org_admin)
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Check permissions
    const isOrgAdmin = user.role === 'org_admin' && user.organization_id === id
    const isAdmin = user.role === 'administrator'
    if (!isOrgAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { email, role } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    // Find user by email
    const { data: existingUser, error: findErr } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (findErr) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user's organization and role if provided
    const updates: any = { organization_id: id }
    if (role && ['org_admin', 'user'].includes(role)) {
      updates.role = role
    }

    const { error: updateErr } = await getSupabaseAdmin()
      .from('users')
      .update(updates)
      .eq('id', existingUser.id)

    if (updateErr) throw updateErr
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
