import PublicPageShell, { PageWrap, PageTitle, Section } from '../_components/PublicPageShell'

export const metadata = {
  title: 'About — YT Transcriber',
  description: 'What YT Transcriber is and who it’s for.',
}

export default function AboutPage() {
  return (
    <PublicPageShell>
      <PageWrap>
        <PageTitle
          kicker="About"
          title="Built for creators who work with video"
          subtitle="YT Transcriber turns YouTube videos into clean, searchable transcripts in minutes."
        />

        <Section heading="What it is">
          YT Transcriber takes any public YouTube video with captions and turns it into a fully searchable,
          timestamped transcript. Paste a link, and within a minute or two you have text you can read, search,
          organise into folders, and export as TXT, SRT, PDF, or a ZIP bundle.
        </Section>

        <Section heading="Who it's for">
          We built it for people who spend their time around video: creators repurposing their own content,
          researchers and journalists pulling quotes, editors writing show notes, students and teams who need to
          find that one moment buried in an hour-long upload. If you’ve ever scrubbed back and forth trying to find
          what someone said, this is for you.
        </Section>

        <Section heading="How it works">
          The service is caption-based. Rather than re-processing audio, we read the captions a video already has —
          including auto-generated ones — and turn them into a clean transcript. That keeps things fast and lets you
          get to the useful part: searching, organising, and exporting.
        </Section>

        <Section heading="We're in beta">
          YT Transcriber is currently in beta. The free Starter plan gives you 5 transcriptions to try it out — no
          credit card required — and paid plans (Pro, Studio, and Enterprise) are on the way with higher limits and
          extra features like folders, share links, and AI chapters. We’re actively building, and your feedback
          shapes what comes next.
        </Section>

        <div style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)' }}>
          Have ideas or questions? <a href="/contact" style={{ color: 'var(--accent)', fontWeight: 600 }}>We’d love to hear from you</a>.
        </div>
      </PageWrap>
    </PublicPageShell>
  )
}
