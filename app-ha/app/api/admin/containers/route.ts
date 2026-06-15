import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { dockerGet } from '@/lib/docker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const containers = await dockerGet('/containers/json?all=true')
    return NextResponse.json({ containers })
  } catch {
    return NextResponse.json(
      { error: 'Docker socket unavailable', containers: [] },
      { status: 503 }
    )
  }
}
