import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KB_ARTICLES } from '@/lib/knowledge-base'

export default async function AdminKnowledgeBasePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const userArticles = KB_ARTICLES.filter(a => a.role === 'user')
  const adminUserArticles = KB_ARTICLES.filter(
    a => a.role === 'admin' && (a.category === 'admin-users' || a.category === 'admin-system')
  )
  const adminArchArticles = KB_ARTICLES.filter(
    a => a.role === 'admin' && a.category === 'admin-architecture'
  )

  const totalArticles = KB_ARTICLES.length
  const videosRecorded = KB_ARTICLES.filter(a => a.videoId !== null).length

  const badgeStyle = (hasVideo: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    background: hasVideo ? 'rgba(34,197,94,0.15)' : 'rgba(229,57,53,0.15)',
    color: hasVideo ? '#22c55e' : 'var(--accent)',
    border: `1px solid ${hasVideo ? 'rgba(34,197,94,0.3)' : 'rgba(229,57,53,0.3)'}`,
  })

  const readTimeBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    background: 'var(--bg-base)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  }

  function ArticleRow({ article }: { article: (typeof KB_ARTICLES)[0] }) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
          {article.title}
        </div>
        <span style={readTimeBadgeStyle}>{article.readTime}</span>
        <span style={badgeStyle(!!article.videoId)}>
          {article.videoId ? 'Video added' : 'No video'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
            cursor: 'pointer',
          }}>
            Edit
          </button>
          <Link
            href={`/knowledge-base/${article.slug}`}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              textDecoration: 'none',
            }}
          >
            Preview
          </Link>
        </div>
      </div>
    )
  }

  function SectionCard({ title, articles }: { title: string; articles: (typeof KB_ARTICLES) }) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h2>
          <span style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-default)',
            borderRadius: '20px',
            padding: '2px 12px',
          }}>
            {articles.length} articles
          </span>
        </div>
        <div>
          {articles.map(article => (
            <ArticleRow key={article.slug} article={article} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Knowledge Base Management
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
            {totalArticles} articles across 3 sections
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer' }}>
          + Add article
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '40px',
      }}>
        {[
          { label: 'Total articles', value: totalArticles },
          { label: 'User articles', value: userArticles.length },
          { label: 'Admin articles', value: adminUserArticles.length + adminArchArticles.length },
          { label: 'Videos recorded', value: `${videosRecorded} / ${totalArticles}` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <SectionCard title="User articles" articles={userArticles} />
      <SectionCard title="Admin — users &amp; billing" articles={adminUserArticles} />
      <SectionCard title="Admin — architecture" articles={adminArchArticles} />

    </div>
  )
}
