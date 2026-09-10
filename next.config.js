/** @type {import('next').NextConfig} */

// Real, functional security headers only. No fabricated compliance badges (SOC 2 / ISO 27001 / etc.)
// are rendered anywhere on this site — Delta Registry has no such certification, and claiming one
// would be a false statement on a public page. These headers are genuine engineering hardening,
// not marketing trust signals.
//
// Content-Security-Policy is NOT set here — it's per-request (nonce-based) in middleware.ts,
// because a static `script-src 'self'` blocks Next.js's own inline hydration scripts and breaks
// the app. See middleware.ts for the real CSP.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.apifyusercontent.com' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
