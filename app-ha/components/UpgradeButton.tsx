'use client'

import { useState } from 'react'

type Tier = 'pro' | 'studio' | 'enterprise'

export function UpgradeButton({ tier, label, className }: { tier: Tier; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
