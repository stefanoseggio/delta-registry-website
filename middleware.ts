import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Real nonce-based CSP: a static `script-src 'self'` blocks Next.js's own inline
// hydration/bootstrap scripts, breaking the app at runtime (confirmed in browser testing —
// tsc/next build don't catch this, only actually loading the page does). The fix is a
// per-request nonce, not `'unsafe-inline'` — that would silently defeat the CSP's purpose.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // 'unsafe-eval' is required only in `next dev` (webpack's Fast Refresh uses eval-based
  // module wrapping) — never included in production, where this would weaken the policy
  // for no reason. Verified by testing both `next dev` and a real `next build && next start`.
  const isDev = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://images.apifyusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://api.apify.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
