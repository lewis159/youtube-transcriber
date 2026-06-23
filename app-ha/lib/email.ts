import * as React from 'react'
import { Resend } from 'resend'
import { logEvent } from '@/lib/event-log'
import { TeamInviteEmail } from '@/emails/TeamInvite'
import { InviteReminderEmail } from '@/emails/InviteReminder'
import { SeatFreedEmail } from '@/emails/SeatFreed'
import { ShareNotifyEmail } from '@/emails/ShareNotify'

/**
 * Transactional email SEND layer (roadmap #85).
 *
 * This is the plumbing only: typed send functions + React Email templates.
 * The actual triggers (invite / reminder / seat-freed / share) live in the
 * B2B features (#76/#77/#78) and are wired LATER — only the admin test-send
 * (app/api/admin/email/test) calls these today.
 *
 * GRACEFUL DEGRADE: the app must run perfectly with no RESEND_API_KEY set
 * (it isn't configured in most envs yet). When the key is missing every send
 * is a no-op that logs `email_skipped` and returns `{ skipped: true }` — it
 * never throws and never breaks a build or a request.
 */

// ── Config ───────────────────────────────────────────────────────────────────
const DEFAULT_FROM = 'YT Transcriber <notifications@bentech.dev>'

function getFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM
}

// Lazily-constructed singleton. Returns null when the key is absent so callers
// can degrade gracefully rather than crash.
let _client: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_client) _client = new Resend(key)
  return _client
}

// ── Result types ─────────────────────────────────────────────────────────────
export type EmailResult =
  | { id: string }
  | { skipped: true }
  | { error: string }

interface SendArgs {
  to: string | string[]
  subject: string
  react: React.ReactElement
  /** Canonical event name, e.g. 'email_team_invite' — used in event_logs. */
  event: string
  /** Extra context attached to the log entry's metadata. */
  meta?: Record<string, unknown>
}

/**
 * Core send helper shared by every typed function. Renders the React template
 * via the Resend SDK's `react` prop, logs the outcome (success AND failure) to
 * event_logs through {@link logEvent}, and NEVER throws — any failure is caught,
 * logged, and returned as `{ error }`.
 */
async function send({ to, subject, react, event, meta }: SendArgs): Promise<EmailResult> {
  const recipients = Array.isArray(to) ? to : [to]
  const baseMeta = { to: recipients, subject, ...meta }

  const resend = getResend()
  if (!resend) {
    await logEvent({
      level: 'warn',
      event: 'email_skipped',
      message: `RESEND_API_KEY not set — skipped "${event}"`,
      metadata: baseMeta,
    })
    return { skipped: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to: recipients,
      subject,
      react,
    })

    if (error || !data) {
      const msg = error?.message ?? 'Unknown Resend error'
      await logEvent({
        level: 'error',
        event: 'email_failed',
        message: `Failed to send "${event}": ${msg}`,
        metadata: { ...baseMeta, kind: event, error: msg },
      })
      return { error: msg }
    }

    await logEvent({
      level: 'info',
      event: 'email_sent',
      message: `Sent "${event}" to ${recipients.join(', ')}`,
      metadata: { ...baseMeta, kind: event, resendId: data.id },
    })
    return { id: data.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await logEvent({
      level: 'error',
      event: 'email_failed',
      message: `Exception sending "${event}": ${msg}`,
      metadata: { ...baseMeta, kind: event, error: msg },
    })
    return { error: msg }
  }
}

// ── Typed send functions ─────────────────────────────────────────────────────

export interface TeamInviteParams {
  to: string
  orgName: string
  inviterName: string
  inviteUrl: string
}

export function sendTeamInvite({
  to,
  orgName,
  inviterName,
  inviteUrl,
}: TeamInviteParams): Promise<EmailResult> {
  return send({
    to,
    subject: `${inviterName} invited you to join ${orgName}`,
    react: TeamInviteEmail({ orgName, inviterName, inviteUrl }),
    event: 'email_team_invite',
    meta: { orgName, inviterName },
  })
}

export interface InviteReminderParams {
  to: string
  orgName: string
  inviteUrl: string
  daysPending: number
}

export function sendInviteReminder({
  to,
  orgName,
  inviteUrl,
  daysPending,
}: InviteReminderParams): Promise<EmailResult> {
  return send({
    to,
    subject: `Reminder: your invitation to ${orgName} is waiting`,
    react: InviteReminderEmail({ orgName, inviteUrl, daysPending }),
    event: 'email_invite_reminder',
    meta: { orgName, daysPending },
  })
}

export interface SeatFreedParams {
  to: string
  orgName: string
  freedMemberEmail: string
}

export function sendSeatFreed({
  to,
  orgName,
  freedMemberEmail,
}: SeatFreedParams): Promise<EmailResult> {
  return send({
    to,
    subject: `A seat just opened up in ${orgName}`,
    react: SeatFreedEmail({ orgName, freedMemberEmail }),
    event: 'email_seat_freed',
    meta: { orgName, freedMemberEmail },
  })
}

export interface ShareNotifyParams {
  to: string
  orgName: string
  sharerName: string
  videoTitle: string
  videoUrl: string
}

export function sendShareNotify({
  to,
  orgName,
  sharerName,
  videoTitle,
  videoUrl,
}: ShareNotifyParams): Promise<EmailResult> {
  return send({
    to,
    subject: `${sharerName} shared "${videoTitle}" with you`,
    react: ShareNotifyEmail({ orgName, sharerName, videoTitle, videoUrl }),
    event: 'email_share_notify',
    meta: { orgName, sharerName, videoTitle },
  })
}
