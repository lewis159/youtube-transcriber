import { Button, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './BrandedLayout'

export interface TeamInviteEmailProps {
  orgName: string
  inviterName: string
  inviteUrl: string
}

export function TeamInviteEmail({
  orgName,
  inviterName,
  inviteUrl,
}: TeamInviteEmailProps) {
  return (
    <BrandedLayout
      preview={`${inviterName} invited you to join ${orgName} on YT Transcriber`}
      reason={`You're receiving this because ${inviterName} invited you to the "${orgName}" team on YT Transcriber.`}
    >
      <Text style={styles.heading}>You&rsquo;ve been invited to {orgName}</Text>
      <Text style={styles.paragraph}>
        {inviterName} has invited you to join the <strong>{orgName}</strong> team
        on YT Transcriber, where you can transcribe, search, and share YouTube
        videos together.
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

export default TeamInviteEmail
