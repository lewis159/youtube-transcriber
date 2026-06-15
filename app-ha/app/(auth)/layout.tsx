'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import SiteFooter from '../_components/SiteFooter'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: '📖' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin', label: 'Admin', icon: '🛡️' },
]

const adminItems = [
  { href: '/admin', label: 'Overview', icon: '🛡️' },
  { href: '/admin/users', label: 'Users & Orgs', icon: '👥' },
  { href: '/admin/billing', label: 'Billing', icon: '💳' },
  { href: '/admin/containers', label: 'Containers', icon: '🐳' },
  { href: '/admin/security', label: 'Security', icon: '🔒' },
  { href: '/admin/roadmap', label: 'Roadmap', icon: '🗺️' },
  { href: '/admin/changelog', label: 'Changelog', icon: '🕐' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: '🏳️' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
  { href: '/admin/organisations', label: 'Organisations', icon: '🏢' },
]

type Role = 'global_admin' | 'support' | 'org_admin' | 'user'

function RoleBadge({ role }: { role: Role }) {
  if (role === 'global_admin') return (
    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(229,57,53,0.12)', color: '#E53935', border: '0.5px solid rgba(229,57,53,0.3)', fontWeight: 700 }}>Global Admin</span>
  )
  if (role === 'support') return (
    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '0.5px solid rgba(59,130,246,0.3)', fontWeight: 700 }}>Support</span>
  )
  if (role === 'org_admin') return (
    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '0.5px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>Org Admin</span>
  )
  return null
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Top nav */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(10px)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 800 }}>
            <span style={{ color: 'var(--accent)' }}>YT</span>
            <span style={{ color: 'var(--text-primary)' }}> Transcriber</span>
          </Link>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {(isAdmin ? adminItems : navItems).map(({ href, label, icon }) => {
              // For admin overview: exact match; for sub-pages: prefix match but not just /admin
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
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    color: active
                      ? 'var(--accent)'
                      : href === '/admin' ? '#E53935' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <Link
              href="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                color: 'var(--text-secondary)', background: 'transparent',
                border: '0.5px solid #2a2a2a', textDecoration: 'none',
              }}
            >
              ← App
            </Link>
          )}
          {isAdmin && <RoleBadge role="global_admin" />}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, ...(isAdmin ? {} : { padding: '40px 32px', maxWidth: '1280px', width: '100%', margin: '0 auto' }) }}>
        {children}
      </main>

      <SiteFooter />

    </div>
  )
}
