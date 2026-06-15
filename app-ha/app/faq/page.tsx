import PublicPageShell, { PageWrap, PageTitle } from '../_components/PublicPageShell'

export const metadata = {
  title: 'FAQ — YT Transcriber',
  description: 'Answers to common questions about YT Transcriber.',
}

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Does it work on any YouTube video?',
    a: 'It works on public videos that have captions available. We build the transcript from the video’s captions, so if a video has captions turned off entirely, we won’t be able to transcribe it. Private and unlisted videos that we can’t access are not supported.',
  },
  {
    q: 'Do videos need captions?',
    a: 'Yes. YT Transcriber is caption-based — it reads the captions YouTube provides for a video (including auto-generated ones) and turns them into a clean, searchable, timestamped transcript. If captions exist, you’re good to go.',
  },
  {
    q: 'What languages are supported?',
    a: 'We support whatever caption languages are available on the video. If a video has captions in a given language, we can produce a transcript in that language.',
  },
  {
    q: 'How many free transcriptions do I get?',
    a: 'The free Starter plan includes 5 transcriptions for the lifetime of your account — no credit card required. It’s a no-pressure way to try the full transcript viewer, search, and TXT export.',
  },
  {
    q: 'What happens when I hit my limit?',
    a: 'Once you’ve used your allowance, you’ll be prompted to upgrade to a paid plan to keep transcribing. Paid plans (Pro: 10/month, Studio: 40/month, Enterprise: unlimited) refresh your allowance each month. Anything you’ve already transcribed stays available.',
  },
  {
    q: 'Do I need a credit card to start?',
    a: 'No. You can sign up and use your 5 free Starter transcriptions without entering any payment details. A card is only needed if you choose to upgrade to a paid plan.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your transcripts are tied to your account and aren’t shared with other users. We use trusted providers (Clerk for sign-in, Supabase for storage, Stripe for billing) and never sell your data. You can export or delete your transcripts at any time. See our Privacy Policy for full details.',
  },
  {
    q: 'What formats can I export?',
    a: 'You can export transcripts as plain text (TXT), subtitles (SRT), PDF, or a ZIP bundle, depending on your plan. That makes it easy to drop transcripts into editing tools, documents, or your own workflow.',
  },
]

export default function FaqPage() {
  return (
    <PublicPageShell>
      <PageWrap>
        <PageTitle
          kicker="Help"
          title="Frequently asked questions"
          subtitle="Everything you might want to know before signing up."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map(({ q, a }) => (
            <div key={q} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '24px 28px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>{q}</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{a}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', fontSize: '15px', color: 'var(--text-secondary)' }}>
          Still have a question? <a href="/contact" style={{ color: 'var(--accent)', fontWeight: 600 }}>Get in touch</a>.
        </div>
      </PageWrap>
    </PublicPageShell>
  )
}
