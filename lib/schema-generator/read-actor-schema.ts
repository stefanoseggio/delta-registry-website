import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ActorMeta, ApifyInputSchema, ResolvedActorSchema } from './types';

/**
 * This module is a LOCAL, DEV-TIME-ONLY generator input — it reads sibling actor-repo checkouts
 * on Stefano's own disk (../../../../.. from this file) and, for actors without a local checkout,
 * calls the live Apify API. It is never imported by the Next.js app itself (no route or component
 * references `lib/schema-generator/*`), so it has no effect on the deployed site's runtime or
 * build — only on the static `public/schemas/*` artifacts its driver (generate-all.ts) writes to
 * disk ahead of a commit. Overridable via APIFY_PORTFOLIO_ROOT for a different checkout location.
 */
export const PORTFOLIO_ROOT =
  process.env.APIFY_PORTFOLIO_ROOT ?? join(__dirname, '..', '..', '..', '..', '..');

function apifyToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      'APIFY_TOKEN is not set. Run: export APIFY_TOKEN=$(apify auth token) before generating schemas for actors without a local checkout.',
    );
  }
  return token;
}

interface ApifyActorVersion {
  versionNumber: string;
  buildTag: string;
  sourceType: string;
  sourceFiles?: Array<{ name: string; format: string; content: string }>;
}

interface ApifyActorDetail {
  id: string;
  title: string;
  description?: string;
  taggedBuilds?: { latest?: { buildNumber: string } };
  versions: ApifyActorVersion[];
}

const actorDetailCache = new Map<string, ApifyActorDetail>();

async function fetchActorDetail(apifyActorId: string): Promise<ApifyActorDetail> {
  const cached = actorDetailCache.get(apifyActorId);
  if (cached) return cached;

  const res = await fetch(`https://api.apify.com/v2/acts/${apifyActorId}?token=${apifyToken()}`);
  if (!res.ok) {
    throw new Error(`Apify API GET /v2/acts/${apifyActorId} failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { data: ApifyActorDetail };
  actorDetailCache.set(apifyActorId, body.data);
  return body.data;
}

/**
 * Finds the actor's real, currently-live version — NOT versions[0], which can be a stale/unused
 * entry (confirmed for real on page-metadata-extractor: its versions[0], "0.0", is a leftover
 * generic CheerioCrawler template, while the real live-tagged build 1.1.5 lives under versions[2],
 * "1.1"). The correct match is taggedBuilds.latest.buildNumber ("1.1.5") truncated to its
 * major.minor prefix ("1.1"), matched against versions[].versionNumber.
 */
function findLiveVersion(detail: ApifyActorDetail): ApifyActorVersion {
  const latestBuildNumber = detail.taggedBuilds?.latest?.buildNumber;
  if (!latestBuildNumber) {
    throw new Error(`Actor ${detail.id} has no taggedBuilds.latest.buildNumber — cannot determine its live version.`);
  }
  const versionPrefix = latestBuildNumber.split('.').slice(0, 2).join('.');
  const match = detail.versions.find((v) => v.versionNumber === versionPrefix);
  if (!match) {
    throw new Error(`Actor ${detail.id}: no versions[] entry matches live version prefix "${versionPrefix}" (from buildNumber "${latestBuildNumber}").`);
  }
  if (match.sourceType !== 'SOURCE_FILES' || !match.sourceFiles) {
    throw new Error(`Actor ${detail.id}: live version "${versionPrefix}" is sourceType=${match.sourceType}, not SOURCE_FILES — no embedded source to read a schema from.`);
  }
  return match;
}

function readEmbeddedFile(version: ApifyActorVersion, path: string): string | null {
  const file = version.sourceFiles?.find((f) => f.name === path);
  return file ? file.content : null;
}

export async function resolveActorSchema(meta: ActorMeta): Promise<ResolvedActorSchema> {
  let inputSchema: ApifyInputSchema;
  let inputSchemaSource: 'local-file' | 'live-api';
  let datasetSchema: Record<string, unknown> | null = null;
  let datasetSchemaSource: 'local-file' | 'live-api' | 'unavailable' = 'unavailable';

  const localInputPath = meta.localDir ? join(PORTFOLIO_ROOT, meta.localDir, '.actor', 'input_schema.json') : null;
  const localDatasetPath = meta.localDir ? join(PORTFOLIO_ROOT, meta.localDir, '.actor', 'dataset_schema.json') : null;

  if (localInputPath && existsSync(localInputPath)) {
    inputSchema = JSON.parse(readFileSync(localInputPath, 'utf-8')) as ApifyInputSchema;
    inputSchemaSource = 'local-file';
    if (localDatasetPath && existsSync(localDatasetPath)) {
      datasetSchema = JSON.parse(readFileSync(localDatasetPath, 'utf-8')) as Record<string, unknown>;
      datasetSchemaSource = 'local-file';
    }
  } else {
    const detail = await fetchActorDetail(meta.apifyActorId);
    const version = findLiveVersion(detail);
    const rawInput = readEmbeddedFile(version, '.actor/input_schema.json');
    if (!rawInput) {
      throw new Error(`Actor ${meta.slug}: no .actor/input_schema.json found in its live embedded source (neither local nor via API).`);
    }
    inputSchema = JSON.parse(rawInput) as ApifyInputSchema;
    inputSchemaSource = 'live-api';
    const rawDataset = readEmbeddedFile(version, '.actor/dataset_schema.json');
    if (rawDataset) {
      datasetSchema = JSON.parse(rawDataset) as Record<string, unknown>;
      datasetSchemaSource = 'live-api';
    }
  }

  // title/description always come from the live Actor API — the single authoritative source,
  // never hand-authored — even for actors whose schema was read locally.
  const detail = await fetchActorDetail(meta.apifyActorId);
  if (!detail.description) {
    throw new Error(`Actor ${meta.slug}: live Actor API returned no description — refusing to invent one.`);
  }

  return {
    meta,
    inputSchemaSource,
    inputSchema,
    datasetSchema,
    datasetSchemaSource,
    title: detail.title,
    description: detail.description,
  };
}
