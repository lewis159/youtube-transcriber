import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { KB_ARTICLES, KBArticle, KBCategory } from '@/lib/knowledge-base'
import ExportPdfButton from './ExportPdfButton'

// ── Static params ────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return KB_ARTICLES.map((a) => ({ slug: a.slug }))
}

// ── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<KBCategory, string> = {
  'getting-started': 'Getting Started',
  'features': 'Features',
  'account': 'Account & Plans',
  'admin-users': 'Users & Billing',
  'admin-system': 'System Management',
  'admin-architecture': 'Architecture',
}

// ── Related articles ─────────────────────────────────────────────────────────
function getRelated(current: KBArticle): KBArticle[] {
  return KB_ARTICLES.filter(
    (a) => a.slug !== current.slug && a.category === current.category,
  ).slice(0, 3)
}

// ── Video section ────────────────────────────────────────────────────────────
function VideoSection({ article }: { article: KBArticle }) {
  if (article.videoId) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9
          marginBottom: '48px',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${article.videoId}`}
          title={article.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px',
          }}
        />
      </div>
    )
  }

  // Coming soon placeholder
  return (
    <div
      style={{
        width: '100%',
        paddingBottom: '56.25%', // 16:9
        position: 'relative',
        marginBottom: '48px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        {/* Play button icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            boxShadow: '0 0 32px var(--accent-glow)',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="white"
            style={{ marginLeft: '4px' }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <p
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px',
            }}
          >
            Video guide coming soon
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {article.title}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function KBArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = KB_ARTICLES.find((a) => a.slug === slug)

  if (!article) {
    notFound()
  }

  // Admin articles require authentication
  if (article.role === 'admin') {
    const { userId } = await auth()
    if (!userId) {
      redirect('/sign-in')
    }
  }

  const related = getRelated(article)
  const categoryLabel = CATEGORY_LABELS[article.category]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 40px 80px' }}>
      {/* ── Breadcrumb + Export row ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
      <nav
        data-print-hide
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/knowledge-base" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Knowledge Base
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text-secondary)' }}>{categoryLabel}</span>
        <span>›</span>
        <span
          style={{
            color: 'var(--text-primary)',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {article.title}
        </span>
      </nav>

      <ExportPdfButton articleTitle={article.title} />
      </div>

      {/* ── Back link ────────────────────────────────────────────────── */}
      <Link
        href="/knowledge-base"
        data-print-hide
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: '28px',
        }}
      >
        ← Back to Knowledge Base
      </Link>

      {/* ── Article header ───────────────────────────────────────────── */}
      <div data-print-show style={{ marginBottom: '36px' }}>
        <h1
          style={{
            fontSize: 'clamp(24px, 4vw, 38px)',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {article.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Read time badge */}
          <span
            style={{
              display: 'inline-block',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            {article.readTime} min read
          </span>

          {/* Category badge */}
          <span
            style={{
              display: 'inline-block',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '4px 14px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            {categoryLabel}
          </span>

          {/* Admin badge */}
          {article.role === 'admin' && (
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(229, 57, 53, 0.15)',
                border: '1px solid var(--accent)',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              Admin only
            </span>
          )}
        </div>
      </div>

      {/* ── Video section ─────────────────────────────────────────────── */}
      <div data-print-hide>
        <VideoSection article={article} />
      </div>

      {/* ── Steps ────────────────────────────────────────────────────── */}
      <section className="knowledge-base-article" style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 28px',
          }}
        >
          Step-by-step guide
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {article.steps.map((step, index) => (
            <div
              key={index}
              style={{
                paddingLeft: '32px',
                borderLeft: '3px solid var(--accent)',
                position: 'relative',
              }}
            >
              {/* Step number circle */}
              <div
                style={{
                  position: 'absolute',
                  left: '-14px',
                  top: '0',
                  width: '26px',
                  height: '26px',
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'white',
                }}
              >
                {index + 1}
              </div>

              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                }}
              >
                {step.heading}
              </h3>

              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {step.body.split('\n').map((line, lineIndex) => {
                  if (line.startsWith('- ')) {
                    return (
                      <div
                        key={lineIndex}
                        style={{ display: 'flex', gap: '8px', marginTop: '4px' }}
                      >
                        <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
                          •
                        </span>
                        <span>{line.slice(2)}</span>
                      </div>
                    )
                  }
                  if (line.trim() === '') {
                    return <div key={lineIndex} style={{ height: '8px' }} />
                  }
                  return (
                    <p key={lineIndex} style={{ margin: '0 0 6px' }}>
                      {line}
                    </p>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Was this helpful? ─────────────────────────────────────────── */}
      <section
        data-print-hide
        className="glass-card"
        style={{
          padding: '28px',
          textAlign: 'center',
          marginBottom: '48px',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
          }}
        >
          Was this article helpful?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: '15px' }}>
            👍 Yes
          </button>
          <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: '15px' }}>
            👎 No
          </button>
        </div>
      </section>

      {/* ── Related articles ──────────────────────────────────────────── */}
      {related.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 20px',
            }}
          >
            Related articles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/knowledge-base/${rel.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: '0 0 3px',
                      }}
                    >
                      {rel.title}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {rel.readTime} min read
                    </p>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: '18px', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
