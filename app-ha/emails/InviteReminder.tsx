import { Button, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './BrandedLayout'

export interface InviteReminderEmailProps {
  orgName: string
  inviteUrl: string
  daysPending: number
}

export function InviteReminderEmail({
  orgName,
  inviteUrl,
  daysPending,
}: InviteReminderEmailProps) {
  const dayLabel = daysPending === 1 ? 'day' : 'days'
  return (
    <BrandedLayout
      preview={`Reminder: your invitation to ${orgName} is still waiting`}
      reason={`You're receiving this reminder because you have a pending invitation to the "${orgName}" team on YT Transcriber.`}
    >
      <Text style={styles.heading}>Your invitation is still waiting</Text>
      <Text style={styles.callout}>
        You were invited to <strong>{orgName}</strong> {daysPending} {dayLabel}{' '}
        ago and haven&rsquo;t accepted yet.
      </Text>
      <Text style={styles.paragraph}>
        Join the team to start transcribing and collaborating on YouTube videos.
        The invitation link is below.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button style={styles.button} href={inviteUrl}>
          Accept invitation
        </Button>
      </Section>
      <Text style={styles.hint}>
        Or paste this link into your browser:
        <br />
        {inviteUrl}
      </Text>
    </BrandedLayout>
  )
}

export default InviteReminderEmail
