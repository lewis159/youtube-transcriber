import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { rebootContainer, recordRebootAttempt } from '@/lib/docker'

const ALLOWED_CONTAINERS = ['app-4001', 'app-4002', 'nginx']

export async function POST(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await requireAdmin()

    const containerName = params.name
    if (!containerName) {
      return NextResponse.json({ error: 'Container name required' }, { status: 400 })
    }

    if (!ALLOWED_CONTAINERS.includes(containerName)) {
      return NextResponse.json({ error: 'Container not allowed' }, { status: 403 })
    }

    // Record reboot attempt
    await recordRebootAttempt(containerName)

    // Reboot container
    await rebootContainer(containerName)

    return NextResponse.json({
      success: true,
      message: `Container ${containerName} reboot initiated`,
      container: containerName,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : msg === 'Container not found' ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
