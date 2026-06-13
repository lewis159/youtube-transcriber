import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// GET /api/organizations/[id] - get org details with members
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    const { data: org, error } = await getSupabaseAdmin()
      .from('organizations')
      .select(
        `
        id,
        name,
        slug,
        created_at,
        users(id, email, tier, role)
        `
      )
      .eq('id', id)
      .single()

    if (error || !org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check access: user can see their own org, admin sees all
    if (user.role === 'user' && user.organization_id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(org)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// PUT /api/organizations/[id] - update org (org_admin or administrator)
export async function PUT(req: Request, { params }: Params) {
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

    const { name, slug } = await req.json()
    const updates: any = {}
    if (name) updates.name = name
    if (slug) updates.slug = slug

    const { data, error } = await getSupabaseAdmin()
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
