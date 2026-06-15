import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import * as http from 'http'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ALLOWED_ACTIONS = ['start', 'stop', 'pause', 'unpause', 'restart', 'kill'] as const
type Action = typeof ALLOWED_ACTIONS[number]

const AUDIT_ACTION: Record<string, string> = {
  start:   'container_start',
  stop:    'container_stop',
  pause:   'container_pause',
  unpause: 'container_unpause',
  restart: 'container_restart',
  kill:    'container_kill',
}

function dockerPost(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: '/var/run/docker.sock',
        path,
        method: 'POST',
        headers: { Host: 'localhost', 'Content-Length': 0 },
      },
      (res) => { resolve(res.statusCode ?? 500) }
    )
    req.on('error', reject)
    req.end()
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { action, phrase, containerName } = await req.json()

  if (!ALLOWED_ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Validate confirmation phrase — must match "<action> <containerName>"
  const expected = `${action} ${containerName}`.toLowerCase().trim()
  if ((phrase ?? '').toLowerCase().trim() !== expected) {
    return NextResponse.json({ error: 'Confirmation phrase did not match' }, { status: 422 })
  }

  try {
    const status = await dockerPost(`/v1.44/containers/${params.id}/${action}`)
    if (status >= 400 && status !== 304) {
      return NextResponse.json({ error: `Docker returned ${status}` }, { status: 502 })
    }

    // Record the action in the admin audit log (best-effort).
    await logAudit({
      action: AUDIT_ACTION[action] ?? `container_${action}`,
      target: 'container',
      details: `${action} container ${containerName}`,
      actorClerkId: userId,
    })

    return NextResponse.json({ success: true, action, containerId: params.id })
  } catch {
    return NextResponse.json({ error: 'Docker socket unavailable' }, { status: 503 })
  }
}
