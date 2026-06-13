'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Article {
  id: string
  slug: string
  title: string
  description: string
  category: string
  is_public: boolean
  order_index: number
}

export default function KnowledgeBaseAdminPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    category: 'setup',
    is_public: true,
  })

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/knowledge-base')
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

  const handleDeleteArticle = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const response = await fetch(`/api/knowledge-base/${slug}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete article')
      setArticles(articles.filter((a) => a.slug !== slug))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article')
    }
  }

  const handleEditArticle = (article: Article) => {
    setFormData({
      slug: article.slug,
      title: article.title,
      description: article.description,
      category: article.category,
      is_public: article.is_public,
    })
    setEditingId(article.id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      slug: '',
      title: '',
      description: '',
      category: 'setup',
      is_public: true,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Knowledge Base Manager</h1>
          <p className="text-[#888] mt-2">Create, edit, and manage help articles</p>
        </div>
        <button
          onClick={() => {
            handleCloseForm()
            setShowForm(true)
          }}
          className="px-4 py-2 bg-[#378ADD] text-white rounded-lg hover:bg-[#2a6bb0] transition font-medium"
        >
          + New Article
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/50 text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-8 bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? 'Edit Article' : 'Create New Article'}
          </h2>
          <ArticleForm
            initialData={formData}
            onSubmit={async (data) => {
              try {
                if (editingId) {
                  const response = await fetch(`/api/knowledge-base/${formData.slug}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  if (!response.ok) throw new Error('Failed to update article')
                } else {
                  const response = await fetch('/api/knowledge-base', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  if (!response.ok) throw new Error('Failed to create article')
                }
                handleCloseForm()
                fetchArticles()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Operation failed')
              }
            }}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Articles Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin mb-4">
            <div className="w-8 h-8 border-4 border-[#378ADD] border-t-transparent rounded-full"></div>
          </div>
          <p className="text-[#888]">Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-[#18181F] border border-[#2A2A35] rounded-lg">
          <p className="text-[#888]">No articles yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A35] bg-[#0F0F13]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, idx) => (
                <tr
                  key={article.id}
                  className={`border-b border-[#2A2A35] ${idx % 2 === 0 ? 'bg-[#18181F]' : 'bg-[#1f1f28]'} hover:bg-[#242430] transition`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{article.title}</p>
                      <p className="text-[#666] text-sm">/{article.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#888]">{article.category}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        article.is_public
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-red-900/30 text-red-300'
                      }`}
                    >
                      {article.is_public ? 'Public' : 'Locked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/knowledge-base/${article.slug}`}
                      target="_blank"
                      className="text-[#378ADD] hover:text-[#4AE070] transition text-sm font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleEditArticle(article)}
                      className="text-[#378ADD] hover:text-[#4AE070] transition text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(article.slug)}
                      className="text-red-400 hover:text-red-300 transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface ArticleFormProps {
  initialData: {
    slug: string
    title: string
    description: string
    category: string
    is_public: boolean
  }
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

function ArticleForm({ initialData, onSubmit, onCancel }: ArticleFormProps) {
  const [formData, setFormData] = useState(initialData)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#E2E2E8] mb-2">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="article-slug"
            className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#378ADD] transition"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#E2E2E8] mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#378ADD] transition"
          >
            <option value="setup">Setup</option>
            <option value="user-management">User Management</option>
            <option value="api">API</option>
            <option value="organizations">Organizations</option>
            <option value="system">System Admin</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#E2E2E8] mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Article title"
          className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#378ADD] transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#E2E2E8] mb-2">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description"
          className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#378ADD] transition"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="w-4 h-4 rounded border border-[#2A2A35] bg-[#0F0F13]"
          />
          <span className="text-[#E2E2E8] text-sm">Make public (visible to all users)</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#2A2A35]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[#888] hover:text-white transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-[#378ADD] text-white rounded-lg hover:bg-[#2a6bb0] disabled:bg-[#666] transition font-medium"
        >
          {submitting ? 'Saving...' : 'Save Article'}
        </button>
      </div>
    </form>
  )
}
