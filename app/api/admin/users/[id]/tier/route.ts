import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

const VALID_TIERS = ['explorer', 'creator', 'studio', 'enterprise']

// POST /api/admin/users/[id]/tier - change user tier
export async function POST(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const { tier } = await req.json()

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      )
    }

    const { error } = await getSupabaseAdmin()
      .from('users')
      .update({ tier })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, tier })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
