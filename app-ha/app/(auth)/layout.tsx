'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
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
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
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
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: '40px 32px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>

    </div>
  )
}
