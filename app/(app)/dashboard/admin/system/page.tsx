'use client'

import { useState, useEffect } from 'react'

interface Container {
  name: string
  health: 'healthy' | 'unhealthy' | 'warning'
  lastReboot: string
  rebootCount: number
  isWarning: boolean
  logs?: string[]
}

export default function SystemHealthPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rebooting, setRebooting] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchContainers = async () => {
    try {
      setError(null)
      const res = await fetch('/api/admin/system/containers')
      if (!res.ok) throw new Error('Failed to fetch containers')
      const data = await res.json()
      setContainers(data.containers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleReboot = async (containerName: string) => {
    if (!confirm(`Are you sure you want to reboot ${containerName}?`)) return

    try {
      setRebooting(containerName)
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/admin/system/containers/${containerName}/reboot`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to reboot container')
      setSuccess(`${containerName} reboot initiated`)
      // Refresh after a brief delay
      setTimeout(fetchContainers, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reboot container')
    } finally {
      setRebooting(null)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return '#4AE070' // Green
      case 'unhealthy':
        return '#E04B4A' // Red
      case 'warning':
        return '#E0B04A' // Yellow
      default:
        return '#888'
    }
  }

  const getHealthEmoji = (health: string) => {
    switch (health) {
      case 'healthy':
        return '🟢'
      case 'unhealthy':
        return '🔴'
      case 'warning':
        return '⚠️'
      default:
        return '⚪'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#888]">Loading system status...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Health</h1>
        <p className="text-[#888]">Monitor and manage container status</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-[#2A0F0F] border border-[#5A1515] rounded-lg p-4 text-[#E04B4A] flex gap-3">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">⚠</div>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-[#0F2A15] border border-[#155A2A] rounded-lg p-4 text-[#4AE070] flex gap-3">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">✓</div>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Containers Grid */}
      <div className="grid gap-4">
        {containers.length === 0 ? (
          <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 text-center text-[#888]">
            No containers found
          </div>
        ) : (
          containers.map(container => (
            <div
              key={container.name}
              className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 hover:border-[#378ADD] transition-colors"
            >
              {/* Container Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getHealthEmoji(container.health)}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{container.name}</h2>
                    <p className="text-sm text-[#888]">
                      Status: <span style={{ color: getHealthColor(container.health) }}>
                        {container.health.charAt(0).toUpperCase() + container.health.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
                {container.isWarning && (
                  <div className="bg-[#5A4A2A] border border-[#8A6A3A] text-[#E0B04A] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    High reboot rate
                  </div>
                )}
              </div>

              {/* Container Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-[#0F0F13] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Last Reboot</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(container.lastReboot).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0F0F13] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Reboot Count (1h)</p>
                  <p className="text-sm font-medium" style={{ color: container.rebootCount > 5 ? '#E04B4A' : '#4AE070' }}>
                    {container.rebootCount}
                  </p>
                </div>
                <div className="bg-[#0F0F13] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Health Status</p>
                  <p className="text-sm font-medium" style={{ color: getHealthColor(container.health) }}>
                    {container.health.charAt(0).toUpperCase() + container.health.slice(1)}
                  </p>
                </div>
                <div className="bg-[#0F0F13] rounded-lg p-3">
                  <p className="text-xs text-[#888] mb-1">Last Updated</p>
                  <p className="text-sm text-white font-medium">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Container Logs */}
              {showLogs === container.name && container.logs && container.logs.length > 0 && (
                <div className="bg-[#0F0F13] rounded-lg p-4 mb-4 border border-[#2A2A35]">
                  <p className="text-xs text-[#888] mb-2 font-medium">Recent Logs (Last 50 lines)</p>
                  <div className="font-mono text-xs text-[#888] max-h-64 overflow-y-auto space-y-1">
                    {container.logs.map((log, idx) => (
                      <div key={idx} className="text-[#666]">
                        <span className="text-[#378ADD]">{idx + 1}.</span> {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogs(showLogs === container.name ? null : container.name)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2A2A35] text-[#888] hover:text-white hover:border-[#378ADD] transition-colors text-sm font-medium"
                >
                  <span>📋</span>
                  {showLogs === container.name ? 'Hide' : 'View'} Logs
                </button>
                <button
                  onClick={() => handleReboot(container.name)}
                  disabled={rebooting === container.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white transition-colors text-sm font-medium"
                >
                  <span>🔄</span>
                  {rebooting === container.name ? 'Rebooting...' : 'Reboot'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-[#0F2A3E] border border-[#1A5A7F] rounded-lg p-4">
        <p className="text-sm text-[#85B7EB]">
          <strong>Auto-refresh:</strong> This page refreshes every 10 seconds to show the latest container status.
          Reboots are logged and tracked. High reboot rates (&gt;5 in 1 hour) trigger warnings.
        </p>
      </div>
    </div>
  )
}
