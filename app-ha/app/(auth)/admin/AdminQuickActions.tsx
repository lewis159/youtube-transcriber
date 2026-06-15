'use client'

import { useState } from 'react'
import BroadcastModal from './BroadcastModal'
import DrainModal from './DrainModal'

// Quick-action buttons for the admin Overview. These previously linked to `#`;
// they now open real modals (broadcast announcement / drain a container).
export default function AdminQuickActions() {
  const [open, setOpen] = useState<null | 'broadcast' | 'drain'>(null)

  const actions: { key: 'broadcast' | 'drain'; icon: string; label: string }[] = [
    { key: 'broadcast', icon: '📣', label: 'Broadcast message' },
    { key: 'drain',     icon: '🚰', label: 'Drain container' },
  ]

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {actions.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setOpen(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px',
              padding: '16px', cursor: 'pointer', textAlign: 'left',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(229,57,53,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
          >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {open === 'broadcast' && <BroadcastModal onClose={() => setOpen(null)} />}
      {open === 'drain' && <DrainModal onClose={() => setOpen(null)} />}
    </>
  )
}
