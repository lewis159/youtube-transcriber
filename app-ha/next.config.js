/** @type {import('next').NextConfig} */

// ── Content-Security-Policy source allowlists ──────────────────────────────────
// Derived from how the app actually loads third parties:
//   • Clerk           (@clerk/nextjs ClerkProvider) — auth widgets, scripts, images, frames
//   • Stripe          (UpgradeButton → /api/stripe/checkout → hosted checkout redirect; js.stripe.com future-proofed)
//   • Google Analytics(components/GoogleAnalytics.tsx — gtag.js + inline init)
//   • YouTube         (TranscriptViewer iframe embed + IFrame API; img/i/s.ytimg thumbnails & player assets)
//   • Supabase/PostgREST (client-side @supabase/supabase-js calls — origin from NEXT_PUBLIC_SUPABASE_URL)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseOrigin = ''
let supabaseWsOrigin = ''
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl)
    supabaseOrigin = u.origin
    // Supabase Realtime uses WebSockets on the same host.
    supabaseWsOrigin = `wss://${u.host}`
  }
} catch {
  // Malformed env value — leave Supabase origins out rather than emit a broken CSP.
}

const clerk = 'https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com'
const stripe = 'https://js.stripe.com https://api.stripe.com'
const ga = 'https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com'
const youtube = 'https://www.youtube.com https://*.ytimg.com https://img.youtube.com https://i.ytimg.com'

const cspDirectives = [
  `default-src 'self'`,
  // 'unsafe-inline'/'unsafe-eval' are required by Clerk, Next.js inline runtime, and the GA init script.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerk} ${stripe} ${ga} https://www.youtube.com https://s.ytimg.com`,
  // Clerk injects styles; inline styles are used throughout the app.
  `style-src 'self' 'unsafe-inline' https://*.clerk.com`,
  `img-src 'self' data: blob: ${clerk} ${ga} ${youtube} https://img.clerk.com`,
  `font-src 'self' data:`,
  `frame-src 'self' ${clerk} https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com https://hooks.stripe.com`,
  `connect-src 'self' ${clerk} ${stripe} ${ga} ${supabaseOrigin} ${supabaseWsOrigin} https://www.youtube.com`,
  `worker-src 'self' blob:`,
  `media-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' https://*.clerk.accounts.dev`,
  `frame-ancestors 'self'`,
]
  .map((d) => d.replace(/\s+/g, ' ').trim())
  .join('; ')

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // App embeds its own YouTube iframes (SAMEORIGIN keeps that working) while
  // blocking the site itself from being framed by third parties.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // NOTE: shipped as Content-Security-Policy-Report-Only (non-breaking) because an
  // enforcing CSP that's even slightly wrong will break Clerk auth / Stripe / Next's
  // inline runtime. Verify in the browser (no CSP violations in the console for sign-in,
  // checkout, GA, and the YouTube player), then rename this key to
  // 'Content-Security-Policy' to enforce it.
  { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
]

module.exports = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
