import type { ResolvedActorSchema } from './types';
import { mappableFields, truncate } from './field-mapper';

const GPT_ACTIONS_TIMEOUT_SECS = 45; // confirmed live, OpenAI's "Production notes on GPT Actions"
const SAFETY_MARGIN_SECS = 35; // headroom under the 45s cap for network + Apify queue time

export interface AsyncPatternDecision {
  useAsync: boolean;
  reason: string;
}

/**
 * Apify's run-sync-get-dataset-items endpoint allows up to 300s; GPT Actions enforces a hard 45s
 * round-trip cap (both confirmed live against their own docs, 2026-09-18) — a real conflict, not
 * hypothetical. Routing uses each actor's REAL observed maximum runtime
 * (RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md), not a guess. 16 of 28 actors have zero production run
 * history — for those, `useAsync: true` is the conservative default (never risk a mid-air
 * GPT Actions timeout on an unmeasured actor), explicitly labeled as precautionary, not measured.
 */
export function decideOpenAPIPattern(maxObservedRuntimeSecs: number | null): AsyncPatternDecision {
  if (maxObservedRuntimeSecs === null) {
    return {
      useAsync: true,
      reason: 'No production run history exists for this actor — defaulting to the async run+poll pattern as a precaution, not a measurement. Re-run this generator once real telemetry exists to potentially switch it to sync.',
    };
  }
  if (maxObservedRuntimeSecs > SAFETY_MARGIN_SECS) {
    return {
      useAsync: true,
      reason: `Real observed max runtime ${maxObservedRuntimeSecs}s exceeds the ${SAFETY_MARGIN_SECS}s safety margin under GPT Actions' ${GPT_ACTIONS_TIMEOUT_SECS}s cap — using POST /runs + poll GET /actor-runs/{runId}.`,
    };
  }
  return {
    useAsync: false,
    reason: `Real observed max runtime ${maxObservedRuntimeSecs}s fits safely under GPT Actions' ${GPT_ACTIONS_TIMEOUT_SECS}s cap — run-sync-get-dataset-items is safe to expose directly.`,
  };
}

function requestBodySchema(resolved: ResolvedActorSchema) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const { name, field, required: isRequired } of mappableFields(resolved.inputSchema)) {
    if (field.type === 'object') {
      throw new Error(`Field "${name}" on ${resolved.meta.slug} is type "object" and survived the EXCLUDED_FIELD_NAMES filter — extend the exclusion list or add real handling before generating.`);
    }
    const desc = truncate(field.description ?? field.title ?? name, 700); // OpenAI's confirmed 700-char parameter-description limit
    const clean: Record<string, unknown> = { type: field.type, description: desc };
    if (field.default !== undefined) clean.default = field.default;
    if (field.enum) clean.enum = field.enum;
    if (field.items) clean.items = { type: field.items.type ?? 'string', ...(field.items.enum ? { enum: field.items.enum } : {}) };
    if (field.pattern !== undefined) clean.pattern = field.pattern;
    if (field.type === 'array') {
      if (field.minItems !== undefined) clean.minItems = field.minItems;
      if (field.maxItems !== undefined) clean.maxItems = field.maxItems;
    } else if (field.minimum !== undefined) {
      clean.minimum = field.minimum;
    }
    properties[name] = clean;
    if (isRequired) required.push(name);
  }
  return { type: 'object' as const, properties, required };
}

/** Builds a complete, valid OpenAPI 3.1 document for one actor — sync or async shape per decideOpenAPIPattern. */
export function toOpenAPISpec(resolved: ResolvedActorSchema): Record<string, unknown> {
  const { slug, apifyActorId } = resolved.meta;
  const decision = decideOpenAPIPattern(resolved.meta.maxObservedRuntimeSecs);
  // Uses the actor's immutable Apify ID, not its slug, for the REST path — Apify's API accepts
  // either the opaque ID or the username~actorName tilde form, but every other adapter in this
  // generator (LangChain/LlamaIndex/CrewAI/AG2) already calls by ID, and this fleet has a real
  // precedent for slug drift (primer-actor was renamed to page-metadata-extractor on the Store
  // this same session) — an adversarial review caught this file as the one inconsistent adapter
  // still building its call from the mutable slug, which would 404 silently if that happened again.
  const restActorPath = apifyActorId;
  const summary = truncate(resolved.description, 300); // OpenAI's confirmed 300-char summary limit
  const schema = requestBodySchema(resolved);

  const responseSchema = resolved.datasetSchema
    ? { type: 'array', items: resolved.datasetSchema }
    : { type: 'array', items: { type: 'object', additionalProperties: true } };

  const paths: Record<string, unknown> = decision.useAsync
    ? {
        [`/acts/${restActorPath}/runs`]: {
          post: {
            operationId: `start${capitalize(camelCase(slug))}Run`,
            summary: `Start an async run of: ${summary}`,
            'x-async-pattern-reason': decision.reason,
            requestBody: { required: true, content: { 'application/json': { schema } } },
            responses: {
              '201': {
                description: 'Run started. Poll GET /actor-runs/{runId} with the returned run id until status is SUCCEEDED, then fetch its dataset items.',
                content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' } } } } } } },
              },
            },
            'x-openai-isConsequential': false,
          },
        },
        '/actor-runs/{runId}': {
          get: {
            operationId: `get${capitalize(camelCase(slug))}RunStatus`,
            summary: 'Poll the status of a previously started run.',
            parameters: [{ name: 'runId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              '200': {
                description: 'Current run status. When status is SUCCEEDED, fetch the dataset via GET /datasets/{datasetId}/items, passing this response\'s defaultDatasetId field as {datasetId}.',
                content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' }, defaultDatasetId: { type: 'string' } } } } } } },
              },
            },
            'x-openai-isConsequential': false,
          },
        },
        '/datasets/{datasetId}/items': {
          get: {
            operationId: `get${capitalize(camelCase(slug))}DatasetItems`,
            summary: 'Fetch the dataset items produced by a completed run.',
            parameters: [{ name: 'datasetId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { '200': { description: 'Array of normalized records from the actor run.', content: { 'application/json': { schema: responseSchema } } } },
            'x-openai-isConsequential': false,
          },
        },
      }
    : {
        [`/acts/${restActorPath}/run-sync-get-dataset-items`]: {
          post: {
            operationId: `run${capitalize(camelCase(slug))}`,
            summary,
            'x-sync-pattern-reason': decision.reason,
            requestBody: { required: true, content: { 'application/json': { schema } } },
            responses: { '200': { description: 'Array of normalized records from the actor run.', content: { 'application/json': { schema: responseSchema } } } },
            'x-openai-isConsequential': false,
          },
        },
      };

  return {
    openapi: '3.1.0',
    info: { title: `Delta Registry — ${resolved.title}`, description: resolved.description, version: '1.0.0' },
    servers: [{ url: 'https://api.apify.com/v2' }],
    paths,
    components: { securitySchemes: { ApifyBearerAuth: { type: 'http', scheme: 'bearer' } } },
    security: [{ ApifyBearerAuth: [] }],
  };
}

function camelCase(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
