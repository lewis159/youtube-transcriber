import { NextResponse } from 'next/server'
import * as http from 'http'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function dockerRequest(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: '/var/run/docker.sock',
        path,
        method: 'GET',
        headers: { Host: 'localhost' },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch { reject(new Error('Invalid JSON from Docker API')) }
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const containers = await dockerRequest('/v1.44/containers/json?all=true')
    return NextResponse.json({ containers })
  } catch {
    return NextResponse.json(
      { error: 'Docker socket unavailable', containers: [] },
      { status: 503 }
    )
  }
}
