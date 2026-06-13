import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getContainerStatus, getAllContainers } from '@/lib/docker'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const containers = await getAllContainers()

    return NextResponse.json({
      containers,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 401
    return NextResponse.json({ error: msg }, { status })
  }
}
