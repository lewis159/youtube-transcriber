import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

const guides: Record<string, { title: string; content: React.ReactNode }> = {
  'getting-started': {
    title: 'Getting Started with YT Transcriber',
    content: (
      <>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Step 1: Create Your Account</h2>
          <p className="text-[#888] mb-4">
            Head to the{' '}
            <Link href="/sign-up" className="text-[#378ADD] hover:text-[#85B7EB]">
              sign-up page
            </Link>{' '}
            and enter your email address. No credit card required — you get 3 free videos to start.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Step 2: Paste a YouTube URL</h2>
          <p className="text-[#888] mb-4">
            Once logged in, you'll see the dashboard with a text box. Simply paste any YouTube URL and click "Transcribe".
          </p>
          <div className="bg-[#0F0F13] border border-[#2A2A35] rounded-lg p-6 mb-4">
            <p className="text-[#666] text-sm">Example:</p>
            <code className="text-[#85B7EB]">https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Step 3: Get Your Transcript</h2>
          <p className="text-[#888] mb-4">
            YT Transcriber fetches the transcript directly from YouTube in seconds. No audio processing, no waiting. You'll see the full transcript with timestamps ready to search, annotate, and export.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">💡 Pro Tip</h2>
          <p className="text-[#888]">
            Each video you transcribe uses one credit. You get 3 free credits per account. Upgrade to unlock unlimited transcripts.
          </p>
        </section>

        {/* Video Placeholder */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 my-8 text-center">
          <p className="text-[#888] mb-4">📹 Video tutorial coming soon</p>
          <p className="text-sm text-[#666]">Watch how to get started in 2 minutes</p>
        </div>
      </>
    ),
  },
  'add-notes': {
    title: 'Add Notes & Highlights',
    content: (
      <>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Why Add Notes?</h2>
          <p className="text-[#888] mb-4">
            Notes help you remember key moments, important quotes, or action items. Each note is timestamped so you can jump straight to that part of the video.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">How to Add a Note</h2>
          <ol className="list-decimal list-inside space-y-3 text-[#888]">
            <li>Open any transcript in your dashboard</li>
            <li>Scroll to the "Notes" section below the transcript</li>
            <li>Click in the text box and type your note</li>
            <li>Your note is automatically saved</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">What You Can Do With Notes</h2>
          <ul className="space-y-3 text-[#888]">
            <li>✅ Add timestamped observations</li>
            <li>✅ Flag important quotes</li>
            <li>✅ Create action items</li>
            <li>✅ Export notes with your transcript as PDF</li>
            <li>✅ Share notes with your team via shareable links</li>
          </ul>
        </section>

        {/* Video Placeholder */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 my-8 text-center">
          <p className="text-[#888] mb-4">📹 Video tutorial coming soon</p>
          <p className="text-sm text-[#666]">See notes in action with a real example</p>
        </div>
      </>
    ),
  },
  'export-formats': {
    title: 'Export & Share Your Transcripts',
    content: (
      <>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Export Options</h2>
          <p className="text-[#888] mb-6">
            YT Transcriber gives you multiple ways to save and share your work.
          </p>

          <div className="space-y-4">
            <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">📄 Plain Text (.txt)</h3>
              <p className="text-[#888] text-sm">Download the transcript as a simple text file. Perfect for searching, editing, or pasting into documents.</p>
              <p className="text-[#666] text-xs mt-2">Available on all plans</p>
            </div>

            <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">📊 ZIP Archive</h3>
              <p className="text-[#888] text-sm">Bundle your transcript and notes into one zip file. Great for organizing multiple exports.</p>
              <p className="text-[#666] text-xs mt-2">Available on all plans</p>
            </div>

            <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">📑 PDF Report</h3>
              <p className="text-[#888] text-sm">Generate a professional PDF with your transcript and notes. Includes video title, URL, and timestamps.</p>
              <p className="text-[#666] text-xs mt-2">Creator tier and above</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">How to Export</h2>
          <ol className="list-decimal list-inside space-y-3 text-[#888]">
            <li>Open the video transcript you want to export</li>
            <li>Look for the "Export" button at the top</li>
            <li>Choose your format (TXT, ZIP, or PDF)</li>
            <li>The file downloads automatically</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Share With Your Team</h2>
          <p className="text-[#888] mb-4">
            Instead of exporting, you can create a shareable link. Anyone with the link can view the transcript and notes without needing an account.
          </p>
        </section>

        {/* Video Placeholder */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 my-8 text-center">
          <p className="text-[#888] mb-4">📹 Video tutorial coming soon</p>
          <p className="text-sm text-[#666]">Walk through exporting in all formats</p>
        </div>
      </>
    ),
  },
  'search-transcripts': {
    title: 'Search & Find Content',
    content: (
      <>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Find What You Need, Fast</h2>
          <p className="text-[#888] mb-4">
            With dozens of transcripts, searching is essential. YT Transcriber lets you search across all your transcripts instantly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">How to Search</h2>
          <ol className="list-decimal list-inside space-y-3 text-[#888]">
            <li>Go to your dashboard</li>
            <li>Use the search box at the top to find videos by title or URL</li>
            <li>Click on a video to open its transcript</li>
            <li>Use your browser's find function (Ctrl+F or Cmd+F) to search within the transcript</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Search Tips</h2>
          <ul className="space-y-3 text-[#888]">
            <li>🔍 <strong>Search by title:</strong> Type the video name or creator</li>
            <li>🔍 <strong>Search within transcript:</strong> Use Ctrl+F for keywords, phrases, or names</li>
            <li>🔍 <strong>Filter by date:</strong> Coming soon — find videos from a specific time period</li>
            <li>🔍 <strong>Organize with folders:</strong> Pro tier feature — group related transcripts</li>
          </ul>
        </section>

        {/* Video Placeholder */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 my-8 text-center">
          <p className="text-[#888] mb-4">📹 Video tutorial coming soon</p>
          <p className="text-sm text-[#666]">Tips for finding content in large transcript libraries</p>
        </div>
      </>
    ),
  },
  'upgrade-tier': {
    title: 'Upgrade Your Plan',
    content: (
      <>
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Why Upgrade?</h2>
          <p className="text-[#888] mb-4">
            The free Explorer tier gives you 3 videos to try. When you're ready for more, upgrade to unlock unlimited transcripts and advanced features.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Plan Comparison</h2>
          <div className="space-y-4 mb-6">
            <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Explorer (Free)</h3>
              <ul className="space-y-2 text-[#888] text-sm">
                <li>✅ 3 free videos</li>
                <li>✅ Notes & search</li>
                <li>✅ Export as TXT</li>
                <li>❌ PDF export</li>
                <li>❌ Folders & sharing</li>
              </ul>
            </div>

            <div className="bg-[#18181F] border border-[#378ADD] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Creator — £7/month</h3>
              <ul className="space-y-2 text-[#888] text-sm">
                <li>✅ 10 videos per month</li>
                <li>✅ Notes & search</li>
                <li>✅ TXT & ZIP export</li>
                <li>✅ PDF export</li>
                <li>✅ Folder organization</li>
                <li>❌ Team sharing</li>
              </ul>
            </div>

            <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Studio — £19/month</h3>
              <ul className="space-y-2 text-[#888] text-sm">
                <li>✅ 40 videos per month</li>
                <li>✅ All Creator features</li>
                <li>✅ Shareable links</li>
                <li>✅ Link screenshots</li>
                <li>✅ AI-powered chapters</li>
                <li>✅ Team collaboration</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">How to Upgrade</h2>
          <ol className="list-decimal list-inside space-y-3 text-[#888]">
            <li>Log in to your account</li>
            <li>Go to Settings → Billing</li>
            <li>Choose your plan</li>
            <li>Enter payment details (secured by Stripe)</li>
            <li>Done! Your plan activates immediately</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
          <p className="text-[#888]">
            Need help choosing a plan?{' '}
            <Link href="/" className="text-[#378ADD] hover:text-[#85B7EB]">
              Contact support
            </Link>
          </p>
        </section>

        {/* Video Placeholder */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-8 my-8 text-center">
          <p className="text-[#888] mb-4">📹 Video tutorial coming soon</p>
          <p className="text-sm text-[#666]">See the difference between tiers in action</p>
        </div>
      </>
    ),
  },
}

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return Object.keys(guides).map((slug) => ({ slug }))
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params
  const guide = guides[slug]

  if (!guide) {
    return (
      <main className="flex flex-col min-h-screen bg-[#0F0F13]">
        <header className="border-b border-[#2A2A35] px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-7 w-auto" />
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#888]">Guide not found</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#0F0F13]">
      {/* Nav */}
      <header className="border-b border-[#2A2A35] px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-7 w-auto" />
        </Link>
        <Link href="/guides" className={buttonVariants({ variant: 'ghost' })}>
          ← All Guides
        </Link>
      </header>

      {/* Content */}
      <article className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">{guide.title}</h1>
          <div className="prose prose-invert max-w-none space-y-8 text-[#888]">{guide.content}</div>
        </div>
      </article>

      {/* Footer CTA */}
      <section className="border-t border-[#2A2A35] px-6 py-8 text-center">
        <p className="text-[#888] mb-4">Ready to transcribe your first video?</p>
        <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>
          Start free — 3 videos included
        </Link>
      </section>
    </main>
  )
}
