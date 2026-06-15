'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { KBArticle } from '@/lib/knowledge-base'

// ── Category emoji icons ─────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'getting-started': '🚀',
  'features': '⚡',
  'account': '👤',
  'troubleshooting': '🛠️',
  'admin-users': '🛡️',
  'admin-system': '🖥️',
  'admin-architecture': '🏗️',
}

function ArticleCard({ article }: { article: KBArticle }) {
  const icon = CATEGORY_ICONS[article.category] ?? '📄'
  return (
    <Link
      href={`/knowledge-base/${article.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="glass-card" style={{ padding: '20px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 6px',
                lineHeight: 1.3,
              }}
            >
              {article.title}
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: '0 0 12px',
                lineHeight: 1.5,
              }}
            >
              {article.description}
            </p>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                borderRadius: '12px',
                padding: '2px 10px',
              }}
            >
              {article.readTime} min read
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function UserArticleSearch({ articles }: { articles: KBArticle[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => {
      const haystack = [a.title, a.description, ...a.tags].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [articles, query])

  return (
    <div>
      {/* Real, client-side search over title / description / tags */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <span
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search knowledge base articles"
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '14px 16px 14px 46px',
            fontSize: '15px',
            color: 'var(--text-primary)',
            outline: 'none',
            backdropFilter: 'var(--card-blur)',
          }}
        />
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '8px 2px' }}>
          No articles match “{query}”. Try a different search term.
        </p>
      )}
    </div>
  )
}
