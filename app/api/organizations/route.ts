import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/organizations - list user's organizations (admin sees all)
export async function GET() {
  try {
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    let query = getSupabaseAdmin()
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false })

    // Admin/support sees all orgs, regular users see only their org
    if (user.role === 'user' || user.role === 'org_admin') {
      query = query.eq('id', user.organization_id)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// POST /api/organizations - create organization (admin only)
export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Only administrators can create orgs
    if (user.role !== 'administrator') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, slug } = await req.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
    }

    const { data, error } = await getSupabaseAdmin()
      .from('organizations')
      .insert({ name, slug })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : msg.includes('unique') ? 409 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
