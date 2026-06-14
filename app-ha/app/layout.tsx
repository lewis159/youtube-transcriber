import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'YouTube Transcriber',
  description: 'Transcribe, translate, and search YouTube videos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
