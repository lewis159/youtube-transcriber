import PublicPageShell, { PageWrap, PageTitle } from '../_components/PublicPageShell'
import ContactForm from './ContactForm'

export const metadata = {
  title: 'Contact — YT Transcriber',
  description: 'Get in touch with the YT Transcriber team.',
}

export default function ContactPage() {
  return (
    <PublicPageShell>
      <PageWrap>
        <PageTitle
          kicker="Support"
          title="Get in touch"
          subtitle="Questions, feedback, or need a hand? We'd love to hear from you."
        />

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '40px',
        }}>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Prefer email? Reach us directly at{' '}
            <a href="mailto:support@bentech.dev" style={{ color: 'var(--accent)', fontWeight: 600 }}>support@bentech.dev</a>.
            We typically reply within a couple of business days.
          </p>
        </div>

        <ContactForm />
      </PageWrap>
    </PublicPageShell>
  )
}
