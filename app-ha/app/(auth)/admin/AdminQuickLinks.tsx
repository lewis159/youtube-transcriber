'use client'

const links = [
  { href: '/admin/users',      icon: '👥', label: 'Users & Orgs' },
  { href: '/admin/billing',    icon: '💳', label: 'Billing' },
  { href: '/admin/containers', icon: '🐳', label: 'Containers' },
  { href: '/admin/security',   icon: '🔒', label: 'Security' },
  { href: '/admin/roadmap',    icon: '🗺️', label: 'Roadmap' },
]

export default function AdminQuickLinks() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
      {links.map(({ href, icon, label }) => (
        <a key={href} href={href} style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: '#0d0d0d',
              border: '0.5px solid #1e1e1e',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(229,57,53,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
          </div>
        </a>
      ))}
    </div>
  )
}
