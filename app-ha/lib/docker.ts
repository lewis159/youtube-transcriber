import * as http from 'http'

/**
 * Docker Engine API client.
 *
 * Talks to a Tecnativa docker-socket-proxy over TCP when DOCKER_HOST is set
 * (e.g. "tcp://docker-socket-proxy:2375"), so the app never touches the raw
 * Docker socket directly. Falls back to the unix socket for local dev.
 *
 * The proxy is configured (CONTAINERS=1, POST=1, everything else denied) to
 * whitelist only the container list + lifecycle endpoints this app uses.
 */

const DOCKER_API_VERSION = 'v1.44'

type Target =
  | { socketPath: string }
  | { host: string; port: number }

function resolveTarget(): Target {
  const dockerHost = process.env.DOCKER_HOST
  if (dockerHost && dockerHost.startsWith('tcp://')) {
    const url = new URL(dockerHost)
    return { host: url.hostname, port: Number(url.port) || 2375 }
  }
  return { socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock' }
}

function baseOptions(): http.RequestOptions {
  const target = resolveTarget()
  if ('socketPath' in target) {
    return { socketPath: target.socketPath, headers: { Host: 'localhost' } }
  }
  return { host: target.host, port: target.port, headers: { Host: 'localhost' } }
}

/** GET a Docker API path and parse the JSON body. */
export function dockerGet<T = unknown>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { ...baseOptions(), path: `/${DOCKER_API_VERSION}${path}`, method: 'GET' },
      (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(data) as T) }
          catch { reject(new Error('Invalid JSON from Docker API')) }
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

/** POST to a Docker API path and resolve with the HTTP status code. */
export function dockerPost(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const headers = { ...baseOptions().headers, 'Content-Length': 0 }
    const req = http.request(
      { ...baseOptions(), path: `/${DOCKER_API_VERSION}${path}`, method: 'POST', headers },
      (res) => { resolve(res.statusCode ?? 500) }
    )
    req.on('error', reject)
    req.end()
  })
}
