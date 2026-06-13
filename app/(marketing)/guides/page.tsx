import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

const guides = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics: sign up, paste a YouTube URL, and get your first transcript in seconds.',
    duration: '3 min read',
    icon: '🚀',
  },
  {
    slug: 'add-notes',
    title: 'Add Notes & Highlights',
    description: 'Annotate important moments in your transcripts with timestamped notes for easy reference.',
    duration: '2 min read',
    icon: '📝',
  },
  {
    slug: 'export-formats',
    title: 'Export & Share',
    description: 'Download transcripts as TXT or PDF, or create shareable links for your team.',
    duration: '3 min read',
    icon: '📥',
  },
  {
    slug: 'search-transcripts',
    title: 'Search & Find Content',
    description: 'Quickly find what you need across all your transcripts with full-text search.',
    duration: '2 min read',
    icon: '🔍',
  },
  {
    slug: 'upgrade-tier',
    title: 'Upgrade Your Plan',
    description: 'Understand the tiers and unlock unlimited transcripts, advanced exports, and team features.',
    duration: '2 min read',
    icon: '⭐',
  },
]

export default function GuidesPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#0F0F13]">
      {/* Nav */}
      <header className="border-b border-[#2A2A35] px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-7 w-auto" />
        </Link>
        <div className="flex gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: 'ghost' })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants({ variant: 'default' })}>
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">How to Use YT Transcriber</h1>
          <p className="text-lg text-[#888] mb-8">
            Learn how to get the most out of YT Transcriber with our comprehensive guides.
          </p>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="px-6 py-8 flex-1">
        <div className="max-w-4xl mx-auto grid gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 hover:border-[#378ADD] transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{guide.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{guide.title}</h3>
                  <p className="text-[#888] mb-3">{guide.description}</p>
                  <p className="text-xs text-[#666]">{guide.duration}</p>
                </div>
                <span className="text-[#378ADD] text-xl">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#2A2A35] px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
        <div className="flex gap-3 justify-center">
          <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>
            Sign up free
          </Link>
          <Link href="/" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
