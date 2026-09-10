import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

const title = 'Delta Registry — Regulatory & Compliance Data Infrastructure'
const description =
  'Delta Registry runs 18 production data-extraction pipelines on Apify — sanctions screening, government procurement, patent enforcement, drug safety, and clinical trial monitoring. Pay-per-event, delta-tracked: you only pay for data that actually changed.'

export const metadata: Metadata = {
  title,
  description,
  // Was pointing at a placeholder (deltaregistry.example) — every relative URL in
  // openGraph/twitter below (e.g. og-image.png) would have resolved against a domain
  // that doesn't exist, silently breaking link-preview images everywhere.
  metadataBase: new URL('https://delta-registry-website.vercel.app'),
  openGraph: {
    title,
    description,
    url: 'https://delta-registry-website.vercel.app',
    siteName: 'Delta Registry',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the nonce here (even though we don't render it ourselves) is what makes Next.js
  // apply it to its own framework-injected <script> tags — without this read, the CSP header
  // in middleware.ts has a nonce that nothing actually uses, and every Next.js script gets
  // blocked in production. Confirmed by testing: this was broken until this line was added.
  const nonce = headers().get('x-nonce') ?? undefined

  return (
    <html lang="en">
      <body className="bg-obsidian font-sans antialiased" data-csp-nonce={nonce}>
        {children}
      </body>
    </html>
  )
}
