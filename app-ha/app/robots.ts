import type { MetadataRoute } from 'next'

// Keep in sync with sitemap.ts.
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://yt.bentech.dev').replace(/\/+$/, '')

/**
 * Next.js App Router robots — served at /robots.txt.
 *
 * Allows crawling of the public site, points crawlers at the sitemap, and
 * disallows the authenticated/private areas and the API so they aren't indexed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/settings',
        '/admin',
        '/video',
        '/api/',
        '/sign-in',
        '/sign-up',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
