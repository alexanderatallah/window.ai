// Vercel and Google Analytics using one component
import Script from "next/script"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"

export function Analytics() {
  return (
    <div>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-3V4HF88J09"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-3V4HF88J09');
        `}
      </Script>
      <VercelAnalytics />
    </div>
  )
}
