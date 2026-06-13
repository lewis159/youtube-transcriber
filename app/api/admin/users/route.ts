import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, listAllUsers } from '@/lib/admin'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    const { users, total } = await listAllUsers(limit, offset)

    return NextResponse.json({
      users,
      total,
      limit,
      offset,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 401
    return NextResponse.json({ error: msg }, { status })
  }
}
