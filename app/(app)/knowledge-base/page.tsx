'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Article {
  id: string
  slug: string
  title: string
  description: string
  category: string
  is_public: boolean
  order_index: number
  updated_at: string
}

const CATEGORIES = [
  { value: 'setup', label: 'Setup' },
  { value: 'user-management', label: 'User Management' },
  { value: 'api', label: 'API' },
  { value: 'organizations', label: 'Organizations' },
  { value: 'system', label: 'System Admin' },
]

const CATEGORY_COLORS: Record<string, string> = {
  setup: 'bg-blue-900/30 text-blue-300 border border-blue-700/50',
  'user-management': 'bg-green-900/30 text-green-300 border border-green-700/50',
  api: 'bg-purple-900/30 text-purple-300 border border-purple-700/50',
  organizations: 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50',
  system: 'bg-red-900/30 text-red-300 border border-red-700/50',
}

export default function KnowledgeBasePage() {
  const searchParams = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  )

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (selectedCategory) params.append('category', selectedCategory)

        const response = await fetch(`/api/knowledge-base?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch articles')

        const data = await response.json()
        setArticles(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-[#0F0F13]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a24] to-[#0F0F13] border-b border-[#2A2A35] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2">Knowledge Base</h1>
          <p className="text-[#888]">Find answers to common questions and learn how to use YT Transcriber.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search articles by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#18181F] border border-[#2A2A35] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#378ADD] transition"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === null
                  ? 'bg-[#378ADD] text-white'
                  : 'bg-[#18181F] text-[#888] border border-[#2A2A35] hover:border-[#378ADD]'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat.value
                    ? 'bg-[#378ADD] text-white'
                    : 'bg-[#18181F] text-[#888] border border-[#2A2A35] hover:border-[#378ADD]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full"></div>
            </div>
            <p className="text-[#888] mt-4">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Articles Grid */}
        {!loading && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#888]">No articles found. Try adjusting your search or filters.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/knowledge-base/${article.slug}`}>
                <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 hover:border-[#378ADD] transition cursor-pointer group h-full flex flex-col">
                  {/* Category Badge */}
                  <div className="mb-4 inline-block">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        CATEGORY_COLORS[article.category] || 'bg-[#2A2A35] text-[#888]'
                      }`}
                    >
                      {CATEGORIES.find((c) => c.value === article.category)?.label || article.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#378ADD] transition">
                    {article.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#888] text-sm mb-4 flex-grow line-clamp-2">
                    {article.description || 'No description available.'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2A2A35] text-xs text-[#666]">
                    <span>
                      Updated {new Date(article.updated_at).toLocaleDateString()}
                    </span>
                    <span className="text-[#378ADD] group-hover:text-[#4AE070] transition">
                      Read More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
