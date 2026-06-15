import Link from 'next/link'
import SiteFooter from './SiteFooter'

/**
 * Shared header + footer chrome for the public marketing pages
 * (privacy, terms, contact, faq, about). Server component — matches
 * the landing page dark theme and CSS-variable language.
 */

export default function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* ── NAV ─────────────────────────────────────── */}
      <header className="mobile-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(10px)', padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', textDecoration: 'none' }}>
          <span style={{ color: 'var(--accent)' }}>YT</span>
          <span style={{ color: 'var(--text-primary)' }}> Transcriber</span>
        </Link>
        <nav className="mobile-nav-items" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/knowledge-base" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Knowledge Base</Link>
          <Link href="/faq" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>FAQ</Link>
          <Link href="/contact" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Contact</Link>
        </nav>
      </header>

      <main>{children}</main>

      <SiteFooter />
    </div>
  )
}

/** Shared content-page heading + wrapper helpers. */
export function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-pad" style={{ maxWidth: '820px', margin: '0 auto', padding: '64px 40px 96px' }}>
      {children}
    </div>
  )
}

export function PageTitle({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      {kicker && (
        <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
          {kicker}
        </div>
      )}
      <h1 style={{ fontSize: 'clamp(30px, 7vw, 44px)', fontWeight: 900, lineHeight: 1.1, marginBottom: subtitle ? '16px' : 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  )
}

export function DraftBanner() {
  return (
    <div style={{
      background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-border)',
      borderRadius: '10px',
      padding: '14px 18px',
      marginBottom: '40px',
      fontSize: '14px',
      color: 'var(--accent)',
      fontWeight: 600,
    }}>
      Draft — pending legal review. This document is provided for transparency and does not yet constitute final, legally reviewed terms.
    </div>
  )
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>{heading}</h2>
      <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{children}</div>
    </section>
  )
}
