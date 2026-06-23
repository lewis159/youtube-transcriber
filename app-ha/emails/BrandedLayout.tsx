import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

/**
 * Shared, email-safe layout for every transactional template.
 *
 * Inline styles only (Gmail/Outlook strip <style> blocks and class selectors),
 * a single fluid container, and the YT Transcriber brand: a dark header band,
 * the brand-red accent (#E53935), and a clean footer carrying the
 * "why am I getting this" line + an unsubscribe link.
 */

// ── Brand palette (mirrors the PDF/document brand spec) ──────────────────────
const BRAND = {
  dark: '#0f0f0f',
  red: '#E53935',
  redLight: '#ffebee',
  light: '#e8e8e8',
  muted: '#888888',
  white: '#ffffff',
  text: '#1f1f1f',
  border: '#eeeeee',
  pageBg: '#f4f4f5',
} as const

export interface BrandedLayoutProps {
  /** Inbox preview snippet (hidden in the body). */
  preview: string
  /** One-line reason this person is receiving the email — shown in the footer. */
  reason: string
  children: React.ReactNode
}

const main: React.CSSProperties = {
  backgroundColor: BRAND.pageBg,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}

const container: React.CSSProperties = {
  backgroundColor: BRAND.white,
  borderRadius: 8,
  margin: '0 auto',
  maxWidth: 600,
  overflow: 'hidden',
  width: '100%',
  border: `1px solid ${BRAND.border}`,
}

const headerBand: React.CSSProperties = {
  backgroundColor: BRAND.dark,
  padding: '24px 32px',
}

const headerTitle: React.CSSProperties = {
  color: BRAND.white,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.2px',
  margin: 0,
}

const accentBar: React.CSSProperties = {
  backgroundColor: BRAND.red,
  fontSize: 1,
  height: 4,
  lineHeight: '4px',
  margin: 0,
}

const content: React.CSSProperties = {
  padding: '32px',
}

const footer: React.CSSProperties = {
  padding: '0 32px 28px',
}

const footerHr: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: '0 0 16px',
}

const footerText: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: 12,
  lineHeight: '18px',
  margin: '0 0 6px',
}

const footerLink: React.CSSProperties = {
  color: BRAND.muted,
  textDecoration: 'underline',
}

export function BrandedLayout({ preview, reason, children }: BrandedLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBand}>
            <Text style={headerTitle}>
              YT Transcriber
            </Text>
          </Section>
          <Section style={accentBar}>&nbsp;</Section>

          <Section style={content}>{children}</Section>

          <Section style={footer}>
            <Hr style={footerHr} />
            <Text style={footerText}>{reason}</Text>
            <Text style={footerText}>
              YT Transcriber &middot;{' '}
              <Link style={footerLink} href="https://yt.bentech.dev">
                yt.bentech.dev
              </Link>{' '}
              &middot;{' '}
              <Link
                style={footerLink}
                href="https://yt.bentech.dev/settings/notifications"
              >
                Manage notifications / unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Shared inline style tokens for template bodies ───────────────────────────
export const styles = {
  brand: BRAND,
  heading: {
    color: BRAND.text,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: '30px',
    margin: '0 0 16px',
  } as React.CSSProperties,
  paragraph: {
    color: BRAND.text,
    fontSize: 15,
    lineHeight: '24px',
    margin: '0 0 16px',
  } as React.CSSProperties,
  button: {
    backgroundColor: BRAND.red,
    borderRadius: 6,
    color: BRAND.white,
    display: 'inline-block',
    fontSize: 15,
    fontWeight: 600,
    padding: '12px 28px',
    textDecoration: 'none',
  } as React.CSSProperties,
  buttonWrap: {
    margin: '8px 0 24px',
  } as React.CSSProperties,
  hint: {
    color: BRAND.muted,
    fontSize: 13,
    lineHeight: '20px',
    margin: '0 0 8px',
  } as React.CSSProperties,
  callout: {
    backgroundColor: BRAND.redLight,
    borderRadius: 6,
    color: BRAND.text,
    fontSize: 15,
    lineHeight: '22px',
    margin: '0 0 20px',
    padding: '14px 18px',
  } as React.CSSProperties,
}

export default BrandedLayout
