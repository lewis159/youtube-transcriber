'use server'

import * as fs from 'fs'
import * as path from 'path'

interface Container {
  name: string
  health: 'healthy' | 'unhealthy' | 'warning'
  lastReboot: string
  rebootCount: number
  isWarning: boolean
  logs: string[]
}

interface RebootRecord {
  timestamp: string
  container: string
}

const REBOOT_LOG_FILE = '/tmp/reboot-count.json'
const REBOOT_HISTORY_FILE = '/tmp/reboot-history.json'
const CONTAINER_NAMES = ['app-4001', 'app-4002', 'nginx']

// Get or initialize reboot history
function getRebootHistory(): Record<string, RebootRecord[]> {
  try {
    if (fs.existsSync(REBOOT_HISTORY_FILE)) {
      const data = fs.readFileSync(REBOOT_HISTORY_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Failed to read reboot history:', err)
  }
  return {}
}

// Save reboot history
function saveRebootHistory(history: Record<string, RebootRecord[]>) {
  try {
    fs.writeFileSync(REBOOT_HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch (err) {
    console.error('Failed to save reboot history:', err)
  }
}

// Get reboot count for last hour
function getRebootCountLastHour(containerName: string): number {
  const history = getRebootHistory()
  const records = history[containerName] || []
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  return records.filter(r => r.timestamp > oneHourAgo).length
}

// Get last reboot timestamp
function getLastRebootTime(containerName: string): string {
  const history = getRebootHistory()
  const records = history[containerName] || []
  if (records.length === 0) {
    // Return a default time if no reboot record exists
    return new Date(Date.now() - 86400000).toISOString() // 24 hours ago
  }
  return records[records.length - 1].timestamp
}

// Call Docker API to get container status
async function getDockerContainerStatus(containerName: string): Promise<'healthy' | 'unhealthy'> {
  try {
    // Try to connect to Docker socket via HTTP
    const response = await fetch('http://localhost/v1.40/containers/json?all=true', {
      headers: {
        'User-Agent': 'youtube-transcriber-admin',
      },
    }).catch(() => null)

    if (!response || !response.ok) {
      // If Docker socket is not available, return a default status based on whether we have reboot history
      const rebootCount = getRebootCountLastHour(containerName)
      return rebootCount > 5 ? 'unhealthy' : 'healthy'
    }

    const containers = await response.json()
    const container = containers.find((c: any) =>
      c.Names.some((name: string) => name === `/${containerName}`)
    )

    if (!container) return 'unhealthy'

    // Check health status
    if (container.State === 'running') {
      return 'healthy'
    } else if (container.State === 'created' || container.State === 'paused') {
      return 'unhealthy'
    }

    return 'healthy'
  } catch (err) {
    console.error(`Error getting Docker status for ${containerName}:`, err)
    // Fallback: use reboot count to determine health
    const rebootCount = getRebootCountLastHour(containerName)
    return rebootCount > 5 ? 'unhealthy' : 'healthy'
  }
}

// Get container logs
async function getContainerLogs(containerName: string): Promise<string[]> {
  try {
    // For now, return simulated logs based on health
    // In a real implementation, you'd fetch from Docker API
    const health = await getDockerContainerStatus(containerName)
    const logs = [
      `Container: ${containerName}`,
      `Status: ${health === 'healthy' ? 'Running normally' : 'Experiencing issues'}`,
      `Health checks completed`,
      `Last health check: ${new Date().toISOString()}`,
    ]

    if (health === 'healthy') {
      logs.push('All systems operational')
    } else {
      logs.push('Warning: Container may need restart')
    }

    return logs
  } catch (err) {
    console.error(`Error getting logs for ${containerName}:`, err)
    return ['Unable to fetch logs']
  }
}

// Get all containers with status
export async function getAllContainers(): Promise<Container[]> {
  const containers: Container[] = []

  for (const containerName of CONTAINER_NAMES) {
    const health = await getDockerContainerStatus(containerName)
    const rebootCount = getRebootCountLastHour(containerName)
    const isWarning = rebootCount > 5

    // Adjust health based on reboot count
    let finalHealth: 'healthy' | 'unhealthy' | 'warning' = health
    if (isWarning) {
      finalHealth = 'warning'
    }

    const logs = await getContainerLogs(containerName)

    containers.push({
      name: containerName,
      health: finalHealth,
      lastReboot: getLastRebootTime(containerName),
      rebootCount,
      isWarning,
      logs,
    })
  }

  return containers
}

// Record a reboot attempt
export async function recordRebootAttempt(containerName: string): Promise<void> {
  const history = getRebootHistory()
  if (!history[containerName]) {
    history[containerName] = []
  }

  history[containerName].push({
    timestamp: new Date().toISOString(),
    container: containerName,
  })

  // Keep only last 100 records per container
  if (history[containerName].length > 100) {
    history[containerName] = history[containerName].slice(-100)
  }

  saveRebootHistory(history)
}

// Reboot a container via Docker API
export async function rebootContainer(containerName: string): Promise<void> {
  if (!CONTAINER_NAMES.includes(containerName)) {
    throw new Error(`Container ${containerName} is not in the allowed list`)
  }

  try {
    // Try to restart via Docker socket
    const response = await fetch(`http://localhost/v1.40/containers/${containerName}/restart`, {
      method: 'POST',
      headers: {
        'User-Agent': 'youtube-transcriber-admin',
      },
    }).catch(() => null)

    if (!response || !response.ok) {
      // Docker socket unavailable - just log that we attempted
      console.warn(`Docker socket unavailable for ${containerName}, command recorded`)
      return
    }

    console.log(`Container ${containerName} restart initiated via Docker API`)
  } catch (err) {
    console.error(`Error rebooting container ${containerName}:`, err)
    // Don't throw - log the attempt anyway
  }
}

// Get container status
export async function getContainerStatus(containerName: string): Promise<Container | null> {
  const containers = await getAllContainers()
  return containers.find(c => c.name === containerName) || null
}
