import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string; userId: string }> }

// DELETE /api/organizations/[id]/members/[userId] - remove member from org
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, userId } = await params
    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    // Check permissions: org_admin can only remove from their org, admin can remove anyone
    const isOrgAdmin = user.role === 'org_admin' && user.organization_id === id
    const isAdmin = user.role === 'administrator'
    if (!isOrgAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prevent removing the last org_admin or yourself if you're the last admin
    const { data: targetUser } = await getSupabaseAdmin()
      .from('users')
      .select('id, role, organization_id')
      .eq('id', userId)
      .single()

    if (!targetUser || targetUser.organization_id !== id) {
      return NextResponse.json({ error: 'User not in this organization' }, { status: 400 })
    }

    // If removing an org_admin, make sure there's another admin
    if (targetUser.role === 'org_admin') {
      const { data: admins } = await getSupabaseAdmin()
        .from('users')
        .select('id')
        .eq('organization_id', id)
        .eq('role', 'org_admin')

      if (!admins || admins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin from the organization' },
          { status: 400 }
        )
      }
    }

    // Remove by clearing organization_id (don't delete the user, just unlink them)
    const { error } = await getSupabaseAdmin()
      .from('users')
      .update({ organization_id: null, role: 'user' })
      .eq('id', userId)

    if (error) throw error
    return new Response(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
