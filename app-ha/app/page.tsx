import { NavCTA, HeroCTA, PricingCTA, FinalCTA } from './LandingCTA'
import SiteFooter from './_components/SiteFooter'

export default function LandingPage() {
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
          <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Pricing <span style={{ fontSize: '10px', color: 'var(--accent)' }}>Soon</span></a>
          <a href="/knowledge-base" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Knowledge Base</a>
          <NavCTA />
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
            Paste a YouTube link. Get a fully searchable transcript, usually in
            a minute or two. Export, organize, and share — built for creators who demand more.
          </p>

          <HeroCTA />
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
              { step: '02', title: 'We process it', desc: 'Transcript is fetched and indexed, usually in a minute or two.' },
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
              { icon: '🎬', title: 'Fast Transcription', desc: 'Paste a YouTube URL and get a full transcript, usually in a minute or two. Supports all public videos.' },
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
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)',
            borderRadius: '20px', padding: '6px 16px', marginBottom: '24px',
            fontSize: '13px', color: 'var(--accent)', fontWeight: 600,
          }}>
            🚧 Coming Soon
          </div>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Pricing is on its way</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.6 }}>
            We&apos;re finalising our plans. Sign up now to get early access and be the first to know when paid plans launch.
          </p>
          <PricingCTA />
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
          No credit card required. Your first 5 transcriptions are free.
        </p>
        <FinalCTA />
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <SiteFooter />

    </div>
  )
}
