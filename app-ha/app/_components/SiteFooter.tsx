import Link from 'next/link'

/**
 * Shared site-wide footer. Server component — dark theme / CSS-variable
 * language. Rendered on the landing page, public marketing pages, and the
 * authenticated app shell so the public links are always reachable.
 */

const footerLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Knowledge Base', href: '/knowledge-base' },
]

export default function SiteFooter() {
  return (
    <footer className="mobile-pad" style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--accent-border)',
      padding: '48px 40px',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '24px',
      }}>
        <Link href="/" style={{ fontSize: '18px', fontWeight: 800, textDecoration: 'none', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)' }}>YT</span> Transcriber
        </Link>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {footerLinks.map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          &copy; 2026 YT Transcriber. Built for creators.
        </div>
      </div>
    </footer>
  )
}
