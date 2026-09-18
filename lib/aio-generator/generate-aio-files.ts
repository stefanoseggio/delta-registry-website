import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTORS, ACTOR_COUNT, DOMAINS } from '../actors';
import { ACTOR_REGISTRY } from '../schema-generator/actor-registry';

/**
 * Generates public/llms.txt, public/llms-full.txt, and public/mcp-server.json from the site's
 * own real data (lib/actors.ts, lib/schema-generator/actor-registry.ts, and the already-committed
 * public/schemas/{slug}/openapi.json files) — never hand-typed, to avoid the exact class of error
 * this sprint caught in its own prior draft: the roadmap document's hand-written MCP URL used the
 * wrong query parameter (`actors=`) and a retired transport path (`/sse`), confirmed wrong against
 * Apify's own current docs. Deriving from source data makes that class of error structurally
 * impossible to repeat.
 */

const OUT_DIR = process.env.APIFY_SCHEMA_OUT_DIR_ROOT ?? join(__dirname, '..', '..', 'public');
const SITE_URL = 'https://delta-registry-website.vercel.app';

// --- llms.txt (per the real llmstxt.org spec: required H1, optional blockquote, optional free
// text, optional H2 "file list" sections of `- [name](url): description` links) -----------------

function buildLlmsTxt(): string {
  const lines: string[] = [];
  lines.push('# Delta Registry');
  lines.push('');
  lines.push(
    `> Pay-per-event regulatory, sanctions, procurement, and corporate-registry monitoring across ${ACTOR_COUNT} independently deployed Apify Actors, spanning ${DOMAINS.length} domains. Delta-classified output — a record unchanged since the last run is never re-delivered and never billed.`,
  );
  lines.push('');
  lines.push(
    'Every Actor bills strictly per delivered event: no subscriptions, no seat licenses, no minimum spend. Full pricing, delta-engine methodology, and BYOK disclosure live on the homepage.',
  );
  lines.push('');
  lines.push('## Core Resources');
  lines.push('');
  lines.push(`- [Homepage](${SITE_URL}): Fleet overview, live pricing, integration workbench, delta-engine documentation.`);
  lines.push(
    `- [MCP server manifest](${SITE_URL}/mcp-server.json): server.json for connecting all ${ACTOR_COUNT} tools over MCP via Apify's hosted gateway (\`https://mcp.apify.com?tools=...\`, Streamable HTTP).`,
  );
  lines.push(`- [AI-agent tool schema manifest](${SITE_URL}/schemas/index.json): every Actor's OpenAI/Anthropic/Gemini/OpenAPI/LangChain/LlamaIndex/CrewAI/AG2 tool definitions.`);
  lines.push(`- [Full documentation (llms-full.txt)](${SITE_URL}/llms-full.txt): every Actor's input fields, defaults, and a runnable request example, in one file.`);
  lines.push('');

  for (const domain of DOMAINS) {
    lines.push(`## ${domain}`);
    lines.push('');
    for (const actor of ACTORS.filter((a) => a.domain === domain)) {
      const primaryPrice = actor.pricing[0];
      const priceLabel = primaryPrice ? `$${primaryPrice.priceUsd} ${primaryPrice.unit}` : 'see Store listing for current pricing';
      lines.push(
        `- [${actor.title}](${actor.storeUrl}): ${actor.jurisdiction}. ${actor.dataSource}. ${priceLabel}. MCP tool schemas: ${SITE_URL}/schemas/${actor.slug}/`,
      );
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [GitHub — awesome-regulatory-monitors](https://github.com/stefanoseggio/awesome-regulatory-monitors): curated source directory and delta-tracking pattern write-up, independent of this site.`);
  lines.push(`- [GitHub — delta-registry-website source](https://github.com/stefanoseggio/delta-registry-website): this site's own source, including the schema generator that produces the AI-agent tool manifests above.`);
  lines.push('');

  return lines.join('\n');
}

// --- llms-full.txt: comprehensive, single-file, real per-actor field documentation pulled from
// the already-committed public/schemas/{slug}/openapi.json (not re-fetched live — those files are
// themselves generated from each actor's real .actor/input_schema.json in the prior sprint). -----

interface OpenAPIField {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
}

function extractRequestFields(openapiDoc: Record<string, unknown>): Array<{ name: string; field: OpenAPIField }> {
  const paths = openapiDoc.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return [];
  for (const pathItem of Object.values(paths)) {
    const post = pathItem.post as Record<string, unknown> | undefined;
    if (!post) continue;
    const requestBody = post.requestBody as Record<string, unknown> | undefined;
    const content = requestBody?.content as Record<string, unknown> | undefined;
    const mediaType = content?.['application/json'] as Record<string, unknown> | undefined;
    const schema = mediaType?.schema as Record<string, unknown> | undefined;
    const properties = schema?.properties as Record<string, OpenAPIField> | undefined;
    if (properties) return Object.entries(properties).map(([name, field]) => ({ name, field }));
  }
  return [];
}

function buildLlmsFullTxt(): string {
  const lines: string[] = [];
  lines.push('# Delta Registry — Full Documentation');
  lines.push('');
  lines.push(
    `Single-file reference for all ${ACTOR_COUNT} Delta Registry Actors: real input fields (pulled from each Actor's own generated OpenAPI schema, not hand-written), a runnable request example, and Store/GitHub links. Generated ${new Date().toISOString().slice(0, 10)} by lib/aio-generator/generate-aio-files.ts from lib/actors.ts and public/schemas/{slug}/openapi.json — never hand-maintained.`,
  );
  lines.push('');
  lines.push(
    'Pricing model: pay-per-event (PPE) on every Actor. A record whose fingerprint matches the previous run is classified SNAPSHOT_NO_DIFF, is never re-delivered to the dataset, and is never billed — only NEW/STATUS_CHANGE/etc. events are charged, at the per-event price listed below.',
  );
  lines.push('');
  lines.push(`MCP: connect all ${ACTOR_COUNT} tools at once via \`https://mcp.apify.com?tools=<comma-separated username/slug list>\` (Streamable HTTP) — see /mcp-server.json for the complete, ready-to-use manifest.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const actor of ACTORS) {
    lines.push(`## ${actor.title}`);
    lines.push('');
    lines.push(`- **Slug**: \`stefano_seggio/${actor.slug}\``);
    lines.push(`- **Domain**: ${actor.domain}`);
    lines.push(`- **Jurisdiction**: ${actor.jurisdiction}`);
    lines.push(`- **Data source**: ${actor.dataSource}`);
    lines.push(`- **Store page**: ${actor.storeUrl}`);
    if (actor.githubUrl) lines.push(`- **Source**: ${actor.githubUrl}`);
    lines.push(`- **BYOK**: ${actor.byok}${actor.byokDetail ? ` — ${actor.byokDetail}` : ''}`);
    lines.push(`- **Delta events**: ${actor.deltaEvents.length ? actor.deltaEvents.join(', ') : 'none (single-pass extractor, not a delta actor)'}`);
    lines.push('');
    lines.push('**Pricing (per delivered event):**');
    lines.push('');
    for (const p of actor.pricing) {
      lines.push(`- \`${p.eventName}\`: $${p.priceUsd} ${p.unit}`);
    }
    if (actor.pricing.length === 0) lines.push('- See the live Store page above for current pricing.');
    lines.push('');

    let openapiDoc: Record<string, unknown>;
    try {
      const raw = readFileSync(join(OUT_DIR, 'schemas', actor.slug, 'openapi.json'), 'utf-8');
      openapiDoc = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      lines.push('_Schema not found in public/schemas/ — run the schema generator (lib/schema-generator/) before regenerating this file._');
      lines.push('');
      lines.push('---');
      lines.push('');
      continue;
    }

    const fields = extractRequestFields(openapiDoc);
    lines.push('**Input fields:**');
    lines.push('');
    if (fields.length === 0) {
      lines.push('_No fields beyond Apify-infrastructure-only ones (e.g. proxy configuration), which are excluded from this documentation._');
    } else {
      lines.push('| Field | Type | Default | Description |');
      lines.push('|---|---|---|---|');
      for (const { name, field } of fields) {
        const type = field.enum ? `enum(${field.enum.join('\\|')})` : (field.type ?? 'unknown');
        const def = field.default !== undefined ? `\`${JSON.stringify(field.default)}\`` : '—';
        const desc = (field.description ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
        lines.push(`| \`${name}\` | ${type} | ${def} | ${desc} |`);
      }
    }
    lines.push('');
    lines.push('**Example request** (`run-sync-get-dataset-items`, real endpoint shape, empty body uses every field\'s own default):');
    lines.push('');
    lines.push('```bash');
    lines.push(`curl -X POST "https://api.apify.com/v2/acts/stefano_seggio~${actor.slug}/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\`);
    lines.push(`  -H "Content-Type: application/json" -d '{}'`);
    lines.push('```');
    lines.push('');
    lines.push(`Full AI-agent tool schemas (OpenAI, Anthropic, Gemini, OpenAPI, LangChain, LlamaIndex, CrewAI, AG2): ${SITE_URL}/schemas/${actor.slug}/`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// --- mcp-server.json: the real, corrected manifest. Query parameter is `tools`, NOT `actors` —
// verified live against docs.apify.com/integrations/mcp, 2026-09-18. Transport is Streamable HTTP
// at the bare https://mcp.apify.com origin — the `/sse` path and SSE transport were removed by
// Apify on 2026-04-01, five and a half months before this file was generated; an earlier draft of
// this fleet's own roadmap document used both the wrong parameter name and the retired `/sse`
// path, caught and corrected here before anything was published. -----------------------------

function buildMcpServerJson(): Record<string, unknown> {
  const toolsParam = ACTOR_REGISTRY.map((a) => `stefano_seggio/${a.slug}`).join(',');
  return {
    $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    name: 'io.github.stefanoseggio/delta-registry',
    title: `Delta Registry — Regulatory & Compliance Monitoring (${ACTOR_COUNT} tools)`,
    description:
      `${ACTOR_COUNT} pay-per-event regulatory, sanctions, procurement, and corporate-registry monitoring tools exposed via Apify's hosted MCP gateway. Delta-classified output so a repeat call never re-bills for an unchanged record.`,
    websiteUrl: SITE_URL,
    repository: { url: 'https://github.com/stefanoseggio/delta-registry-website', source: 'github' },
    version: '1.0.0',
    remotes: [
      {
        type: 'streamable-http',
        url: `https://mcp.apify.com?tools=${toolsParam}`,
        headers: [
          {
            name: 'Authorization',
            description: 'Bearer <your Apify API token> — required by Apify\'s MCP gateway, not issued or brokered by Delta Registry.',
            isRequired: true,
            isSecret: true,
          },
        ],
      },
    ],
    _meta: {
      'io.modelcontextprotocol.registry/publisher-provided': {
        'com.deltaregistry': {
          toolCount: ACTOR_COUNT,
          domains: DOMAINS,
          pricingModel: 'pay-per-event',
          operatedBy: 'apify-hosted-mcp-gateway',
          transport: 'streamable-http',
          note: "This entry describes Delta Registry's tool scope on Apify's shared, hosted MCP server (mcp.apify.com) — not a server Delta Registry independently operates. The MCP protocol implementation is Apify's; the tools, data, and pricing are Delta Registry's.",
        },
      },
    },
  };
}

function main() {
  writeFileSync(join(OUT_DIR, 'llms.txt'), buildLlmsTxt(), 'utf-8');
  console.log('wrote public/llms.txt');

  writeFileSync(join(OUT_DIR, 'llms-full.txt'), buildLlmsFullTxt(), 'utf-8');
  console.log('wrote public/llms-full.txt');

  writeFileSync(join(OUT_DIR, 'mcp-server.json'), JSON.stringify(buildMcpServerJson(), null, 2), 'utf-8');
  console.log('wrote public/mcp-server.json');
}

main();
