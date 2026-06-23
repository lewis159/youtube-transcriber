import { Button, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './BrandedLayout'

export interface SeatFreedEmailProps {
  orgName: string
  freedMemberEmail: string
}

export function SeatFreedEmail({
  orgName,
  freedMemberEmail,
}: SeatFreedEmailProps) {
  return (
    <BrandedLayout
      preview={`A seat just opened up in ${orgName}`}
      reason={`You're receiving this because you're an administrator of the "${orgName}" team on YT Transcriber.`}
    >
      <Text style={styles.heading}>A seat just opened up</Text>
      <Text style={styles.paragraph}>
        <strong>{freedMemberEmail}</strong> has left the{' '}
        <strong>{orgName}</strong> team, so a seat is now available. You can
        invite a new member to take their place.
      </Text>
      <Section style={styles.buttonWrap}>
        <Button style={styles.button} href="https://yt.bentech.dev/team">
          Manage your team
        </Button>
      </Section>
      <Text style={styles.hint}>
        Manage members and seats anytime from your team settings.
      </Text>
    </BrandedLayout>
  )
}

export default SeatFreedEmail
