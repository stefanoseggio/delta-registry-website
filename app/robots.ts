import type { MetadataRoute } from 'next'

const SITE_URL = 'https://delta-registry-website.vercel.app'

// Explicit, named allow rules for AI crawlers rather than relying on the default-allow catch-all
// below — legible to a human auditing this file, and immune to a future default-deny change
// elsewhere in the stack. The mandate named GPTBot/ClaudeBot/PerplexityBot/Bytespider/
// Applebot-Extended explicitly; the five *-User/*-SearchBot entries are a disclosed addition —
// live, user-triggered fetch crawlers (not training crawlers), directly relevant to this site's
// actual AIO goal of being fetchable mid-conversation, not just indexed for training.
const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Bytespider',
  'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
