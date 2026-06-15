import PublicPageShell, { PageWrap, PageTitle, DraftBanner, Section } from '../_components/PublicPageShell'

export const metadata = {
  title: 'Privacy Policy — YT Transcriber',
  description: 'How YT Transcriber collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <PageWrap>
        <PageTitle kicker="Legal" title="Privacy Policy" subtitle="Last updated 15 June 2026" />
        <DraftBanner />

        <Section heading="1. Overview">
          YT Transcriber (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the service&rdquo;) helps you turn YouTube videos into
          searchable transcripts. This policy explains what personal data we collect, why we collect it, who we share it
          with, and the rights you have over it. By using the service you agree to the practices described here.
        </Section>

        <Section heading="2. Data we collect">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Account information.</strong> When you sign up we collect your email address (and any name or profile detail you provide) through our authentication provider, Clerk.</li>
            <li><strong>Video metadata and transcripts.</strong> When you submit a YouTube link, we store the video URL, title, thumbnail, and the resulting transcript text in our database (Supabase). We do not download or re-host the video itself.</li>
            <li><strong>Usage data.</strong> We record how many transcriptions you have created in order to enforce plan limits, along with folder names, notes, and share-link settings you create.</li>
            <li><strong>Billing data.</strong> If you subscribe to a paid plan, payment is processed by Stripe. We do not store full card details — Stripe holds those and returns only a customer reference and subscription status to us.</li>
            <li><strong>Technical data.</strong> Standard log and analytics data such as IP address, browser type, and pages visited, collected via Google Analytics.</li>
          </ul>
        </Section>

        <Section heading="3. How we use your data">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>To provide the core service — fetching captions, generating transcripts, and letting you search, organise, and export them.</li>
            <li>To manage your account, authenticate you, and enforce plan and usage limits.</li>
            <li>To process subscriptions and payments.</li>
            <li>To understand product usage and improve the service.</li>
            <li>To contact you about your account, security, or important service changes.</li>
          </ul>
        </Section>

        <Section heading="4. Third-party services">
          We rely on a small number of trusted processors. Each handles data only as needed to deliver their function:
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li><strong>Clerk</strong> — authentication and account management.</li>
            <li><strong>Supabase</strong> — database and storage for your transcripts and metadata.</li>
            <li><strong>Stripe</strong> — subscription billing and payment processing.</li>
            <li><strong>Google Analytics</strong> — anonymised, aggregate usage analytics.</li>
          </ul>
          We do not sell your personal data to anyone.
        </Section>

        <Section heading="5. Cookies">
          We use cookies and similar technologies to keep you signed in, remember preferences, and measure usage through
          Google Analytics. You can control or block cookies through your browser settings, though some features may not
          work correctly if you do.
        </Section>

        <Section heading="6. Data retention">
          We keep your transcripts and account data for as long as your account is active. If you delete a transcript it is
          removed from our active database. If you close your account, we delete your personal data within a reasonable
          period, except where we are required to retain certain records (for example billing records) to meet legal
          obligations.
        </Section>

        <Section heading="7. Your rights">
          We process your personal data in accordance with the UK GDPR and the Data Protection Act 2018. You have the right to
          access, correct, export (data portability), and erase your personal data, and to object to or restrict certain
          processing. You can export your transcripts at any time using the built-in export tools (TXT, SRT, PDF, or ZIP). To
          request access to or deletion of your account data, contact us using the details below. If you believe we have not
          handled your personal data correctly, you have the right to lodge a complaint with the UK Information Commissioner&apos;s
          Office (ICO) at ico.org.uk.
        </Section>

        <Section heading="8. Security">
          We use industry-standard measures to protect your data, including encryption in transit and access controls on our
          systems. No method of transmission or storage is completely secure, but we work to protect your information and to
          notify you of any incident as required by law.
        </Section>

        <Section heading="9. Contact">
          Questions about this policy or your data? Email us at{' '}
          <a href="mailto:support@bentech.dev" style={{ color: 'var(--accent)' }}>support@bentech.dev</a>{' '}
          or use our <a href="/contact" style={{ color: 'var(--accent)' }}>contact page</a>.
        </Section>
      </PageWrap>
    </PublicPageShell>
  )
}
