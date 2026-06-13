'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Article {
  id: string
  slug: string
  title: string
  description: string
  category: string
  is_public: boolean
  content: string
  updated_at: string
}

const CATEGORIES: Record<string, string> = {
  setup: 'Setup',
  'user-management': 'User Management',
  api: 'API',
  organizations: 'Organizations',
  system: 'System Admin',
}

const CATEGORY_COLORS: Record<string, string> = {
  setup: 'bg-blue-900/30 text-blue-300 border border-blue-700/50',
  'user-management': 'bg-green-900/30 text-green-300 border border-green-700/50',
  api: 'bg-purple-900/30 text-purple-300 border border-purple-700/50',
  organizations: 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50',
  system: 'bg-red-900/30 text-red-300 border border-red-700/50',
}

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    const fetchArticle = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/knowledge-base/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch article')
        }

        const data = await response.json()
        setArticle(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F13] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full"></div>
          </div>
          <p className="text-[#888]">Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#0F0F13]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-900/20 border border-red-700/50 text-red-300 p-6 rounded-lg text-center">
            <p className="mb-4">{error || 'Article not found'}</p>
            <Link href="/knowledge-base" className="text-[#378ADD] hover:text-[#4AE070] transition">
              ← Back to Knowledge Base
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F13]">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/knowledge-base" className="hover:text-white transition">
            Knowledge Base
          </Link>
          <span>/</span>
          <Link
            href={`/knowledge-base?category=${article.category}`}
            className="hover:text-white transition"
          >
            {CATEGORIES[article.category] || article.category}
          </Link>
          <span>/</span>
          <span className="text-white">{article.title}</span>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-gradient-to-b from-[#1a1a24] to-[#0F0F13] border-b border-[#2A2A35]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Category Badge */}
          <div className="mb-4 inline-block">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                CATEGORY_COLORS[article.category] || 'bg-[#2A2A35] text-[#888]'
              }`}
            >
              {CATEGORIES[article.category] || article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-3">{article.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-[#888]">
            <span>Last updated {new Date(article.updated_at).toLocaleDateString()}</span>
            {!article.is_public && (
              <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs font-medium">
                Admin Only
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold text-white mt-6 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-bold text-white mt-4 mb-3" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-lg font-bold text-white mt-3 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-[#E2E2E8] mb-4 leading-relaxed" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside mb-4 text-[#E2E2E8] space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside mb-4 text-[#E2E2E8] space-y-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-[#E2E2E8]" {...props} />
              ),
              code: ({ node, inline, ...props }) => {
                if (inline) {
                  return (
                    <code
                      className="bg-[#18181F] text-[#4AE070] px-2 py-1 rounded text-sm font-mono"
                      {...props}
                    />
                  )
                }
                return (
                  <code
                    className="block bg-[#18181F] text-[#4AE070] p-4 rounded-lg mb-4 overflow-x-auto font-mono text-sm"
                    {...props}
                  />
                )
              },
              pre: ({ node, ...props }) => (
                <pre className="bg-[#18181F] border border-[#2A2A35] p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-[#378ADD] pl-4 py-2 text-[#888] italic mb-4"
                  {...props}
                />
              ),
              a: ({ node, ...props }) => (
                <a className="text-[#378ADD] hover:text-[#4AE070] transition underline" {...props} />
              ),
              table: ({ node, ...props }) => (
                <table className="w-full border-collapse mb-4" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="border border-[#2A2A35] bg-[#18181F] px-4 py-2 text-white font-bold text-left" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-[#2A2A35] px-4 py-2 text-[#E2E2E8]" {...props} />
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-[#2A2A35] flex items-center justify-between">
          <Link
            href="/knowledge-base"
            className="text-[#378ADD] hover:text-[#4AE070] transition font-medium"
          >
            ← Back to Knowledge Base
          </Link>
          <div className="text-[#666] text-sm">
            Last updated {new Date(article.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
