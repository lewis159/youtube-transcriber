import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

export default async function LandingPage() {
  const { userId } = await auth()
  const isSignedIn = !!userId

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* ── NAV ─────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(10px)',
        padding: '0 40px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--accent)' }}>YT</span>
          <span style={{ color: 'var(--text-primary)' }}> Transcriber</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Pricing</a>
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Sign In</Link>
              <Link href="/sign-up" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
                Start Free
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section style={{
        background: 'var(--hero-gradient)',
        padding: '120px 40px 100px',
        textAlign: 'center',
        borderBottom: '1px solid var(--accent-border)',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: 600,
            marginBottom: '32px',
            letterSpacing: '0.5px',
          }}>
            Now in Beta — Free to get started
          </div>

          <h1 style={{
            fontSize: '64px',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #e8e8e8 0%, var(--accent) 60%, #ff6b6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Transcribe.<br />Discover.<br />Amplify.
          </h1>

          <p style={{
            fontSize: '20px',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 48px',
            lineHeight: 1.6,
          }}>
            Paste a YouTube link. Get a fully searchable transcript in seconds.
            Export, organize, and share — built for creators who demand more.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isSignedIn ? (
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/sign-up" className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
                Start Free — No card needed
              </Link>
            )}
            <a href="#features" className="btn-secondary" style={{ fontSize: '16px', padding: '14px 36px' }}>
              See Features
            </a>
          </div>

          {/* Social proof */}
          <div style={{
            marginTop: '64px',
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '10K+', label: 'Transcripts created' },
              { value: '< 5s', label: 'Average processing' },
              { value: '99.9%', label: 'Uptime' },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>How it works</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '56px' }}>Three steps to your transcript</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { step: '01', title: 'Paste a URL', desc: 'Drop any YouTube link into the input box.' },
              { step: '02', title: 'We process it', desc: 'Transcript is fetched and indexed in seconds.' },
              { step: '03', title: 'Search & export', desc: 'Full-text search, PDF, TXT, SRT — whatever you need.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginBottom: '16px', letterSpacing: '2px' }}>
                  {step}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Everything you need</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
              Powerful tools for every type of creator
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { icon: '🎬', title: 'Instant Transcription', desc: 'Paste a YouTube URL and get a full transcript in under 5 seconds. Supports all public videos.' },
              { icon: '🔍', title: 'Full-Text Search', desc: 'Search across all your transcripts at once. Jump to any moment in the video.' },
              { icon: '📄', title: 'Multiple Export Formats', desc: 'Download as TXT, PDF, SRT, or ZIP bundle. Use your transcript anywhere.' },
              { icon: '🗂️', title: 'Folders & Organisation', desc: 'Organise transcripts into folders by project, client, or topic. Stay tidy.' },
              { icon: '🔗', title: 'Share Links', desc: 'Generate a shareable link with optional download permissions and expiry date.' },
              { icon: '🤖', title: 'AI Chapters (Soon)', desc: 'Automatic chapter detection and smart summaries. Coming to Studio tier.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" style={{
        padding: '100px 40px',
        background: 'linear-gradient(180deg, transparent 0%, var(--accent-subtle) 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Simple, transparent pricing</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Start free. Upgrade when you need more.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', alignItems: 'start' }}>

            {/* Explorer */}
            <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Explorer</div>
              <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent)', margin: '12px 0 4px' }}>Free</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Forever free</div>
              <Link href={isSignedIn ? '/dashboard' : '/sign-up'} className="btn-secondary" style={{ textAlign: 'center', marginBottom: '28px', textDecoration: 'none' }}>
                {isSignedIn ? 'Go to Dashboard' : 'Get started'}
              </Link>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['3 transcriptions/month', 'Basic search', 'Download TXT', '❌ PDF & exports', '❌ Folders', '❌ Sharing'].map(f => (
                  <li key={f} style={{ fontSize: '14px', color: f.startsWith('❌') ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Creator — featured */}
            <div style={{
              padding: '36px',
              borderRadius: '16px',
              border: '1px solid var(--accent)',
              background: 'var(--pricing-featured-bg)',
              boxShadow: 'var(--pricing-featured-shadow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
                color: 'white',
                padding: '4px 16px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}>
                MOST POPULAR
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Creator</div>
              <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent)', margin: '12px 0 4px' }}>
                $9<span style={{ fontSize: '18px', fontWeight: 500 }}>/mo</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>or $90/year — save 2 months</div>
              <Link href={isSignedIn ? '/dashboard' : '/sign-up'} className="btn-primary" style={{ textAlign: 'center', marginBottom: '28px', textDecoration: 'none' }}>
                {isSignedIn ? 'Go to Dashboard' : 'Start free trial'}
              </Link>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Unlimited transcriptions', 'Advanced search', 'All export formats', 'Folders & organisation', 'Share links', '❌ AI features'].map(f => (
                  <li key={f} style={{ fontSize: '14px', color: f.startsWith('❌') ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Studio */}
            <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Studio</div>
              <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent)', margin: '12px 0 4px' }}>
                $29<span style={{ fontSize: '18px', fontWeight: 500 }}>/mo</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>or $290/year — save 2 months</div>
              <Link href={isSignedIn ? '/dashboard' : '/sign-up'} className="btn-secondary" style={{ textAlign: 'center', marginBottom: '28px', textDecoration: 'none' }}>
                {isSignedIn ? 'Go to Dashboard' : 'Upgrade to Studio'}
              </Link>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Everything in Creator', 'AI chapter detection', 'Smart corrections', 'Advanced sharing', 'Download analytics', 'Priority support'].map(f => (
                  <li key={f} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Enterprise</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', margin: '12px 0 4px' }}>Custom</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Contact us for pricing</div>
              <a href="mailto:hello@yttranscriber.com" className="btn-secondary" style={{ textAlign: 'center', marginBottom: '28px', textDecoration: 'none' }}>
                Contact Sales
              </a>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Everything in Studio', 'API access', 'Team seats', 'SSO / SAML', 'Dedicated support', 'Custom SLA'].map(f => (
                  <li key={f} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────── */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center',
        borderTop: '1px solid var(--accent-border)',
      }}>
        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px' }}>
          No credit card required. Your first 3 transcriptions are free.
        </p>
        <Link href={isSignedIn ? '/dashboard' : '/sign-up'} className="btn-primary" style={{ fontSize: '18px', padding: '16px 48px', textDecoration: 'none' }}>
          {isSignedIn ? 'Go to Dashboard' : 'Create your free account'}
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--accent-border)',
        padding: '48px 40px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>
            <span style={{ color: 'var(--accent)' }}>YT</span> Transcriber
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {['Features', 'Pricing', 'Privacy', 'Terms'].map(link => (
              <a key={link} href="#" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>{link}</a>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            &copy; 2026 YT Transcriber. Built for creators.
          </div>
        </div>
      </footer>

    </div>
  )
}
