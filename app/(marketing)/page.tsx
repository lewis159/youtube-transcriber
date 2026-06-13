import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg">YT Transcriber</span>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Start free</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-24 gap-6">
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl">
          Turn any YouTube video into searchable text
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl">
          Paste a URL, get a full transcript in seconds. Add notes, export PDFs, share with your team.
        </p>
        <div className="flex gap-4">
          <Link href="/sign-up">
            <Button size="lg">Start free — no card needed</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">3 free videos · No credit card</p>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { title: 'Instant transcripts', body: 'Fetches captions directly from YouTube — no audio processing needed.' },
            { title: 'Notes & search', body: 'Add timestamped notes and search across all your transcripts.' },
            { title: 'Export & share', body: 'Download as TXT or PDF, or create a shareable link for your team.' },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t px-6 py-16 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Simple pricing</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { tier: 'Explorer', price: 'Free', desc: '3 videos lifetime', cta: 'Get started' },
              { tier: 'Creator', price: '£7/mo', desc: '10 videos/month + top-ups', cta: 'Start Creator' },
              { tier: 'Studio', price: '£19/mo', desc: '40 videos/month + extras', cta: 'Start Studio' },
              { tier: 'Enterprise', price: '£45/mo', desc: 'Unlimited + team + API', cta: 'Start Enterprise' },
            ].map((p) => (
              <div key={p.tier} className="rounded-lg border bg-background p-6 flex flex-col gap-4">
                <div>
                  <p className="font-semibold">{p.tier}</p>
                  <p className="text-2xl font-bold">{p.price}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
                <Link href="/sign-up" className="mt-auto">
                  <Button className="w-full" variant={p.tier === 'Studio' ? 'default' : 'outline'}>
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} YT Transcriber
      </footer>
    </main>
  )
}
