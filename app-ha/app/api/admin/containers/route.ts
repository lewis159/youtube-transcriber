import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { dockerGet } from '@/lib/docker'

// Describe where the app is trying to reach Docker, for accurate error copy.
// Mirrors resolveTarget() in lib/docker.ts (which we don't own / edit).
function describeDockerTarget(): string {
  const dockerHost = process.env.DOCKER_HOST
  if (dockerHost && dockerHost.startsWith('tcp://')) return dockerHost
  return `unix:${process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'}`
}

export const dynamic = 'force-dynamic'

// Connection-level errno codes that mean "the Docker endpoint isn't reachable
// from this environment" — i.e. the socket-proxy isn't deployed / not on the
// network. This is a deploy dependency, not an application bug.
const UNREACHABLE_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ECONNRESET',
  'EPIPE',
  'ENOENT', // unix socket path missing (local-dev fallback)
])

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const containers = await dockerGet('/containers/json?all=true')
    return NextResponse.json({ containers })
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code
    const target = describeDockerTarget()

    if (code && UNREACHABLE_CODES.has(code)) {
      // Environment / deploy issue: the Docker endpoint can't be reached.
      return NextResponse.json(
        {
          error: `Cannot reach the Docker endpoint at ${target} (${code}). The docker-socket-proxy service is not reachable from this environment.`,
          reason: 'unreachable',
          target,
          containers: [],
        },
        { status: 503 }
      )
    }

    // A genuine error talking to Docker (bad response, JSON parse, etc.).
    return NextResponse.json(
      {
        error: `Error talking to the Docker endpoint at ${target}: ${
          (err as Error)?.message || 'unknown error'
        }`,
        reason: 'error',
        target,
        containers: [],
      },
      { status: 502 }
    )
  }
}
