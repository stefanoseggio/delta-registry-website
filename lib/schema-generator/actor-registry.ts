import type { ActorMeta } from './types';

/**
 * The real, complete 28-actor fleet, verified live on 2026-09-18 against `GET /v2/acts?my=true`
 * (apifyActorId, slug) and direct filesystem checks for `.actor/input_schema.json` (localDir).
 *
 * `localDir` is relative to the apify-portfolio root (see PORTFOLIO_ROOT in read-actor-schema.ts).
 * null means no local checkout carries this actor's real source — 8 actors are docs-wrapper repos
 * or (page-metadata-extractor) have no git repo at all; their schemas are resolved live from the
 * Apify API's embedded `sourceFiles` instead (see read-actor-schema.ts).
 *
 * `maxObservedRuntimeSecs` is the real maximum `stats.runTimeSecs` across every run this actor has
 * ever executed, taken directly from RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md's Block "real dataset"
 * table (itself pulled live from the Apify API on 2026-09-17/18). 16 of 28 actors have zero
 * production run history — their value is null, not a guessed number.
 */
export const ACTOR_REGISTRY: ActorMeta[] = [
  { slug: 'actor-18-b2b-lead-magnet', apifyActorId: '5QufcYxRkFNHM4h8K', localDir: 'actor-18-b2b-lead-magnet', maxObservedRuntimeSecs: null },
  { slug: 'actor-19-maritime-sanctions-monitor', apifyActorId: 'dR68wHyuOLS2WEhmo', localDir: 'actor-19-maritime-sanctions-monitor', maxObservedRuntimeSecs: 6.8 },
  { slug: 'actor-20-mdb-procurement-monitor', apifyActorId: 'dyzTtWjfyYd7bvUZY', localDir: 'actor-20-mdb-procurement-monitor', maxObservedRuntimeSecs: null },
  { slug: 'actor-21-patent-ip-enforcement-monitor', apifyActorId: 'fTvz8lwj3F1FrPQfM', localDir: 'actor-21-patent-ip-enforcement-monitor', maxObservedRuntimeSecs: null },
  { slug: 'actor-22-drug-safety-recalls-monitor', apifyActorId: 'HJZvKxFUpZop6gIQ3', localDir: 'actor-22-drug-safety-recalls-monitor', maxObservedRuntimeSecs: null },
  { slug: 'actor-24-clinical-trials-delta-engine', apifyActorId: 'PkYgfW33Sh6teGXUX', localDir: null, maxObservedRuntimeSecs: null },
  { slug: 'ai-crawler-content-signal-permission-monitor', apifyActorId: 'eWDx4XY54R5GXysFi', localDir: null, maxObservedRuntimeSecs: 2.9 },
  { slug: 'aozora-bunko-public-domain-text-feed', apifyActorId: 'K0XRDbUteacQL3jeF', localDir: null, maxObservedRuntimeSecs: 10.7 },
  { slug: 'australia-grantconnect-monitor', apifyActorId: 'gt7wS4T0uFRXDz49n', localDir: 'australia-grantconnect-monitor', maxObservedRuntimeSecs: null },
  { slug: 'cordoba-compras-monitor', apifyActorId: 'q9jhMgJRSGjyNbXKA', localDir: 'cordoba-compras-monitor', maxObservedRuntimeSecs: null },
  { slug: 'diario-oficial-cl-monitor', apifyActorId: 'qfBeEKuLfYUw9UOuW', localDir: 'diario-oficial-cl-monitor', maxObservedRuntimeSecs: 6.3 },
  { slug: 'emerging-market-sovereign-debt-auction-monitor', apifyActorId: 'V3i5xKy1kf7vL0Rue', localDir: 'emerging-market-sovereign-debt-auction-monitor', maxObservedRuntimeSecs: 5.6 },
  { slug: 'entrerios-compras-monitor', apifyActorId: 'oiXeFzZGlIQ6mKgoo', localDir: 'entrerios-compras-monitor', maxObservedRuntimeSecs: null },
  { slug: 'eu-ted-procurement-delta-monitor', apifyActorId: 'Zxy0w0zjmUoMzacF9', localDir: 'repo/ted-procurement', maxObservedRuntimeSecs: 429.2 },
  { slug: 'florida-tenders-monitor', apifyActorId: 'afSZyXLVcgnLpucyo', localDir: 'florida-tenders-monitor', maxObservedRuntimeSecs: null },
  { slug: 'kipris-patent-trademark-status-monitor', apifyActorId: '9Wg73rplxFqgVq6fY', localDir: null, maxObservedRuntimeSecs: null },
  { slug: 'mendoza-compras-monitor', apifyActorId: 'bb4cRgt1i27hvr9Ug', localDir: 'mendoza-compras-monitor', maxObservedRuntimeSecs: 98.1 },
  { slug: 'page-metadata-extractor', apifyActorId: 'U9fUBHDngX6IyjzzF', localDir: null, maxObservedRuntimeSecs: null },
  { slug: 'pba-tenders-monitor', apifyActorId: 'yWvRQyWSyGVLJPtQ7', localDir: 'pba-tenders-monitor', maxObservedRuntimeSecs: null },
  { slug: 'regione-lombardia-grants-registry-monitor', apifyActorId: 'f0xRlvzERsbgbU1ru', localDir: null, maxObservedRuntimeSecs: 9.1 },
  { slug: 'salta-compras-monitor', apifyActorId: 'Tx9wBKZyySZa5WcsE', localDir: 'salta-compras-monitor', maxObservedRuntimeSecs: null },
  { slug: 'santafe-compras-monitor', apifyActorId: 'jfoq1flE7KqKb3qAb', localDir: 'santafe-compras-monitor', maxObservedRuntimeSecs: null },
  { slug: 'sec-enforcement-litigation-delta-feed', apifyActorId: 'EDhT9Mvrdm2hzTECA', localDir: null, maxObservedRuntimeSecs: 186.2 },
  { slug: 'singapore-acra-registry-monitor', apifyActorId: 'ht22I1rCH3Ah9QGnM', localDir: null, maxObservedRuntimeSecs: 971.5 },
  { slug: 'tucuman-compras-monitor', apifyActorId: 'TdJtze8dfyykMj2qA', localDir: 'tucuman-compras-monitor', maxObservedRuntimeSecs: null },
  { slug: 'uae-corporate-registry-monitor', apifyActorId: 'BmhA43NYN15DxOLTD', localDir: 'repo/uae-corporate-registry', maxObservedRuntimeSecs: 41.5 },
  { slug: 'uk-hse-enforcement-monitor', apifyActorId: 'jV35qppM82fjyjsle', localDir: 'uk-hse-enforcement-monitor', maxObservedRuntimeSecs: null },
  { slug: 'uk-modern-slavery-statement-registry-monitor', apifyActorId: 'vWDvsAd2iXgVp5aC7', localDir: 'repo/uk-modern-slavery', maxObservedRuntimeSecs: 7.6 },
];

if (ACTOR_REGISTRY.length !== 28) {
  throw new Error(`ACTOR_REGISTRY expected 28 actors, found ${ACTOR_REGISTRY.length} — fleet count drifted, update this file before generating.`);
}
