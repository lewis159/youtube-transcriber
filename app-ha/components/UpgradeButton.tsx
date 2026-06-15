'use client'

import { useState } from 'react'

type Tier = 'pro' | 'studio' | 'enterprise'

export function UpgradeButton({ tier, label, className }: { tier: Tier; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      // Graceful degradation — e.g. 503 when Stripe keys aren't set yet.
      setMessage(res.status === 503 ? 'Payments coming soon.' : (data.error ?? 'Unable to start checkout.'))
    } catch {
      setMessage('Unable to start checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{
          background: loading ? '#333' : '#e53e3e',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '10px 20px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        {loading ? 'Redirecting...' : (label ?? `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}
      </button>
      {message && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#999', textAlign: 'center' }}>{message}</p>
      )}
    </div>
  )
}
