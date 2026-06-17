'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminItems = [
  { href: '/admin', label: 'Overview', icon: '🛡️' },
  { href: '/admin/users', label: 'Users & Orgs', icon: '👥' },
  { href: '/admin/billing', label: 'Billing', icon: '💳' },
  { href: '/admin/containers', label: 'Containers', icon: '🐳' },
  { href: '/admin/security', label: 'Security', icon: '🔒' },
  { href: '/admin/roadmap', label: 'Roadmap', icon: '🗺️' },
  { href: '/admin/changelog', label: 'Changelog', icon: '🕐' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: '🏳️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      borderRight: '1px solid var(--nav-border)',
      background: 'var(--nav-bg)',
      padding: '20px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
        padding: '4px 12px 10px',
      }}>
        Admin
      </div>
      {adminItems.map(({ href, label, icon }) => {
        // Overview: exact match; sub-pages: prefix match (but never let /admin match a sub-page)
        const active = href === '/admin'
          ? pathname === '/admin'
          : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              color: active ? '#E53935' : 'var(--text-secondary)',
              background: active ? 'rgba(229,57,53,0.10)' : 'transparent',
              border: active ? '1px solid rgba(229,57,53,0.30)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '15px' }}>{icon}</span>
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
