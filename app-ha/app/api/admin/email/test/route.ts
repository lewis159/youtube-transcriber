import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  sendTeamInvite,
  sendInviteReminder,
  sendSeatFreed,
  sendShareNotify,
  type EmailResult,
} from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Admin-only end-to-end test harness for the transactional email layer.
 *
 * POST { to: string, template?: 'team_invite' | 'invite_reminder' | 'seat_freed'
 *        | 'share_notify' | 'all' }
 *
 * Sends a SAMPLE of the chosen template (or all four) to `to` using fixed dummy
 * data, so the operator can verify the pipeline once RESEND_API_KEY + EMAIL_FROM
 * are configured. Returns the Resend id(s), or the skipped/error state per
 * template — mirroring how the real callers degrade gracefully.
 */

const TEMPLATES = [
  'team_invite',
  'invite_reminder',
  'seat_freed',
  'share_notify',
] as const
type Template = (typeof TEMPLATES)[number]

const SAMPLE_ORG = 'Acme Studios'

function sampleSend(template: Template, to: string): Promise<EmailResult> {
  switch (template) {
    case 'team_invite':
      return sendTeamInvite({
        to,
        orgName: SAMPLE_ORG,
        inviterName: 'Sam Operator',
        inviteUrl: 'https://yt.bentech.dev/invite/sample-token',
      })
    case 'invite_reminder':
      return sendInviteReminder({
        to,
        orgName: SAMPLE_ORG,
        inviteUrl: 'https://yt.bentech.dev/invite/sample-token',
        daysPending: 3,
      })
    case 'seat_freed':
      return sendSeatFreed({
        to,
        orgName: SAMPLE_ORG,
        freedMemberEmail: 'former.member@example.com',
      })
    case 'share_notify':
      return sendShareNotify({
        to,
        orgName: SAMPLE_ORG,
        sharerName: 'Sam Operator',
        videoTitle: 'How transcription works — a sample video',
        videoUrl: 'https://yt.bentech.dev/v/sample-video-id',
      })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  let body: { to?: unknown; template?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const to = typeof body.to === 'string' ? body.to.trim() : ''
  if (!to || !to.includes('@')) {
    return NextResponse.json(
      { error: 'A valid "to" email address is required' },
      { status: 400 }
    )
  }

  const requested = typeof body.template === 'string' ? body.template : 'all'
  const targets: Template[] =
    requested === 'all'
      ? [...TEMPLATES]
      : TEMPLATES.includes(requested as Template)
        ? [requested as Template]
        : []

  if (targets.length === 0) {
    return NextResponse.json(
      {
        error: `Unknown template "${requested}". Use one of: ${TEMPLATES.join(', ')}, all`,
      },
      { status: 400 }
    )
  }

  const results: Record<string, EmailResult> = {}
  for (const template of targets) {
    results[template] = await sampleSend(template, to)
  }

  return NextResponse.json({ to, results })
}
