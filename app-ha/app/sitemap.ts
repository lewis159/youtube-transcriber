import type { MetadataRoute } from 'next'
import { KB_ARTICLES } from '@/lib/knowledge-base'

// Canonical public base URL. Uses the app's own URL at build/runtime
// (NEXT_PUBLIC_APP_URL is baked per-environment); falls back to the prod domain.
// If the public site ever moves to the apex bentech.dev, change the fallback.
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://yt.bentech.dev').replace(/\/+$/, '')

/**
 * Next.js App Router sitemap — served at /sitemap.xml.
 *
 * Lists ONLY public, crawlable pages. Authenticated areas (dashboard, settings,
 * /video, all /admin), the API, and the sign-in/up pages are deliberately
 * excluded (they're also disallowed in robots.ts). Public knowledge-base
 * articles are generated from KB_ARTICLES (role === 'user' only), so the sitemap
 * stays in sync as articles are added.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  }> = [
    { path: '/',               priority: 1.0, changeFrequency: 'weekly' },
    { path: '/pricing',        priority: 0.9, changeFrequency: 'weekly' },
    { path: '/knowledge-base', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/faq',            priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about',          priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact',        priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy',        priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms',          priority: 0.3, changeFrequency: 'yearly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Public (user-facing) knowledge-base articles. Admin articles are excluded.
  const kbEntries: MetadataRoute.Sitemap = KB_ARTICLES.filter(
    (article) => article.role === 'user'
  ).map((article) => ({
    url: `${BASE_URL}/knowledge-base/${article.slug}`,
    lastModified: article.lastUpdated ? new Date(article.lastUpdated) : now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticEntries, ...kbEntries]
}
