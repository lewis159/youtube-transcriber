import Link from 'next/link'

export default function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(10px)', padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', textDecoration: 'none' }}>
          <span style={{ color: 'var(--accent)' }}>YT</span>
          <span style={{ color: 'var(--text-primary)' }}> Transcriber</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/knowledge-base" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Knowledge Base</Link>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/sign-in" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>Sign in</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
