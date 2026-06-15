import PublicPageShell, { PageWrap, PageTitle, DraftBanner, Section } from '../_components/PublicPageShell'

export const metadata = {
  title: 'Terms of Service — YT Transcriber',
  description: 'The terms that govern your use of YT Transcriber.',
}

export default function TermsPage() {
  return (
    <PublicPageShell>
      <PageWrap>
        <PageTitle kicker="Legal" title="Terms of Service" subtitle="Last updated 15 June 2026" />
        <DraftBanner />

        <Section heading="1. Acceptance of terms">
          By creating an account or using YT Transcriber (&ldquo;the service&rdquo;) you agree to these Terms of Service. If
          you do not agree, please do not use the service. We may update these terms from time to time; continued use after
          changes means you accept the updated terms.
        </Section>

        <Section heading="2. Accounts">
          You must provide accurate information when you register and keep your login credentials secure. You are responsible
          for all activity under your account. You must be old enough to form a binding contract in your jurisdiction to use
          the service.
        </Section>

        <Section heading="3. Acceptable use">
          You agree not to misuse the service. In particular, you may not:
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li>Use the service to infringe anyone&rsquo;s intellectual-property, privacy, or other rights.</li>
            <li>Attempt to circumvent plan limits, security controls, or access other users&rsquo; data.</li>
            <li>Transcribe content you do not have the right to process, or use transcripts in a way that breaks the law.</li>
            <li>Overload, disrupt, scrape, or reverse-engineer the service.</li>
          </ul>
        </Section>

        <Section heading="4. Subscriptions and billing">
          The service offers a free Starter plan (5 lifetime transcriptions) and paid plans (Pro, Studio, Enterprise) with
          monthly transcription allowances. Paid plans are billed in advance through Stripe. You can cancel at any time; your
          plan remains active until the end of the current billing period. Fees are non-refundable except where required by
          law. We may change pricing with reasonable notice.
        </Section>

        <Section heading="5. YouTube content and captions">
          The service generates transcripts from captions made available for YouTube videos. We do not download, store, or
          re-host the underlying video or audio. You are responsible for ensuring you have the right to transcribe and use the
          content you submit. Your use of YouTube is also subject to YouTube&rsquo;s own terms. We are not affiliated with,
          endorsed by, or sponsored by YouTube or Google.
        </Section>

        <Section heading="6. Your content">
          You retain ownership of the transcripts and notes you create. You grant us the limited rights needed to store,
          process, and display that content so we can provide the service to you. You are responsible for the content you
          submit and generate.
        </Section>

        <Section heading="7. Disclaimers">
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind.
          Transcripts are generated from available captions and may contain errors, omissions, or inaccuracies. We do not
          guarantee that the service will be uninterrupted, error-free, or that any particular video can be transcribed.
        </Section>

        <Section heading="8. Limitation of liability">
          To the maximum extent permitted by law, YT Transcriber and its operators will not be liable for any indirect,
          incidental, special, or consequential damages, or for any loss of data, revenue, or profits arising from your use of
          the service. Our total liability for any claim is limited to the amount you paid us in the twelve months before the
          claim.
        </Section>

        <Section heading="9. Termination">
          You may stop using the service and delete your account at any time. We may suspend or terminate your access if you
          breach these terms or use the service in a way that risks harm to us or others. On termination your right to use the
          service ends, and we may delete your data in line with our Privacy Policy.
        </Section>

        <Section heading="10. Governing law">
          These terms and any dispute or claim arising out of or in connection with them are governed by and construed in
          accordance with the law of England and Wales. You and we both agree to the exclusive jurisdiction of the courts of
          England and Wales. Nothing in these terms affects your statutory rights as a consumer.
        </Section>

        <Section heading="11. Contact">
          Questions about these terms? Email{' '}
          <a href="mailto:support@bentech.dev" style={{ color: 'var(--accent)' }}>support@bentech.dev</a>{' '}
          or visit our <a href="/contact" style={{ color: 'var(--accent)' }}>contact page</a>.
        </Section>
      </PageWrap>
    </PublicPageShell>
  )
}
