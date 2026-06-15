import Script from 'next/script'

/**
 * Google Analytics 4 (gtag.js).
 * Renders nothing unless NEXT_PUBLIC_GA_ID is set (e.g. "G-XXXXXXXXXX"),
 * so dev/preview builds stay clean and no ID is hardcoded.
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
