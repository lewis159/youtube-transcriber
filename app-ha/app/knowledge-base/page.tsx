import Link from 'next/link'
import { KB_ARTICLES } from '@/lib/knowledge-base'
import UserArticleSearch from './UserArticleSearch'

export default function KnowledgeBasePage() {
  const userArticles = KB_ARTICLES.filter((a) => a.role === 'user')

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--hero-gradient)',
          padding: '80px 40px 60px',
          textAlign: 'center',
          borderBottom: '1px solid var(--accent-border)',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '20px',
            }}
          >
            Help Centre
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 900,
              letterSpacing: '-1px',
              margin: '0 0 16px',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Knowledge Base
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: 'var(--text-secondary)',
              margin: '0 0 36px',
              lineHeight: 1.6,
            }}
          >
            Step-by-step guides, feature explanations, and technical references for YT Transcriber.
          </p>
        </div>
      </section>

      {/* ── ARTICLE SECTIONS ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '48px',
            alignItems: 'start',
          }}
        >
          {/* ── For Users ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '24px' }}>📖</span>
              <div>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  For Users
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Get the most out of YT Transcriber
                </p>
              </div>
            </div>
            <UserArticleSearch articles={userArticles} />
          </section>

          {/* ── For Administrators ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <div>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  For Administrators
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Platform management and technical reference
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 16px',
                }}
              >
                🔒
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                }}
              >
                Admin access required
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: '0 0 24px',
                  lineHeight: 1.6,
                }}
              >
                Administrator articles cover platform setup, user management, billing controls, and
                system architecture. Sign in with an admin account to view them.
              </p>
              <Link
                href="/sign-in"
                className="btn-primary"
                style={{ fontSize: '14px', padding: '10px 24px' }}
              >
                Sign in with admin access
              </Link>

              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  textAlign: 'left',
                }}
              >
                {[
                  { icon: '👥', label: 'Users & Billing' },
                  { icon: '🖥️', label: 'System Management' },
                  { icon: '🏗️', label: 'Architecture Docs' },
                  { icon: '📋', label: 'Audit Logs' },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 40px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Can&apos;t find what you&apos;re looking for?{' '}
          <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Contact support →
          </Link>
        </p>
      </footer>
    </>
  )
}
