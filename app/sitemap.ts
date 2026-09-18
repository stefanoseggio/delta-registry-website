import type { MetadataRoute } from 'next'
import { ACTORS } from '@/lib/actors'

const SITE_URL = 'https://delta-registry-website.vercel.app'

// Per-actor entries point at each actor's OpenAPI 3.1 schema (public/schemas/{slug}/openapi.json)
// as the canonical, self-describing per-actor URL — there is no per-actor HTML page on this
// single-page site, and OpenAPI is the most broadly-recognized of the 10 generated formats per
// actor. Listing raw JSON in a sitemap is unconventional for classic web SEO (sitemaps are
// normally HTML pages), but deliberate here: the goal is AI-agent/crawler discovery of real,
// fetchable tool definitions, not just human page indexing.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/llms-full.txt`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/mcp-server.json`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/schemas/index.json`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const actorEntries: MetadataRoute.Sitemap = ACTORS.map((actor) => ({
    url: `${SITE_URL}/schemas/${actor.slug}/openapi.json`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticEntries, ...actorEntries]
}
