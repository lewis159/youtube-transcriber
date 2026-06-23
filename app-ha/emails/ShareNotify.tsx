import { Button, Section, Text } from '@react-email/components'
import { BrandedLayout, styles } from './BrandedLayout'

export interface ShareNotifyEmailProps {
  orgName: string
  sharerName: string
  videoTitle: string
  videoUrl: string
}

export function ShareNotifyEmail({
  orgName,
  sharerName,
  videoTitle,
  videoUrl,
}: ShareNotifyEmailProps) {
  return (
    <BrandedLayout
      preview={`${sharerName} shared "${videoTitle}" with you`}
      reason={`You're receiving this because ${sharerName} shared a transcript with you in the "${orgName}" team on YT Transcriber.`}
    >
      <Text style={styles.heading}>{sharerName} shared a transcript</Text>
      <Text style={styles.paragraph}>
        {sharerName} shared a video transcript with you in{' '}
        <strong>{orgName}</strong>:
      </Text>
      <Text style={styles.callout}>{videoTitle}</Text>
      <Section style={styles.buttonWrap}>
        <Button style={styles.button} href={videoUrl}>
          Open transcript
        </Button>
      </Section>
      <Text style={styles.hint}>
        Or paste this link into your browser:
        <br />
        {videoUrl}
      </Text>
    </BrandedLayout>
  )
}

export default ShareNotifyEmail
