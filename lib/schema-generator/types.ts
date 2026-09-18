/**
 * Shared types for the unified multi-protocol schema generator.
 *
 * Every field name here mirrors Apify's real `.actor/input_schema.json` vocabulary
 * (https://apify.com/schemas/v1/input.ide.json), verified against 20 real, locally-checked-out
 * actor schemas across the fleet on 2026-09-18 (see actor-registry.ts for the per-actor source map).
 */

export type ApifyFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';

export interface ApifyInputField {
  type: ApifyFieldType;
  title?: string;
  description?: string;
  default?: unknown;
  editor?: string;
  sectionCaption?: string;
  prefill?: unknown;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  enum?: string[];
  enumTitles?: string[];
  items?: { type?: string; enum?: string[] };
  /** Real, observed-but-unmapped shape: Apify's own free-form proxy config (`proxyConfiguration`).
   *  Fields with this exact `editor` value are Apify-infrastructure-only and are excluded from
   *  every generated external-protocol schema — see EXCLUDED_FIELD_NAMES below. */
  properties?: Record<string, unknown>;
}

export interface ApifyInputSchema {
  $schema?: string;
  title?: string;
  type: 'object';
  schemaVersion?: number;
  properties: Record<string, ApifyInputField>;
  required?: string[];
}

/**
 * Fields that are Apify-platform-infrastructure concerns (proxy routing, run-time knobs a caller
 * of an external LLM-tool protocol has no business setting) rather than semantic tool parameters.
 * Confirmed real, not hypothetical: `proxyConfiguration` is the only `type: "object"` field found
 * across a 20-actor scan of the fleet's real input schemas (cordoba-compras-monitor,
 * pba-tenders-monitor), and both instances are Apify's own standard proxy-config editor.
 * Excluding it is a deliberate design decision, not a silent gap — documented here and in
 * AI_INTEROPERABILITY_EXECUTION_REPORT.md.
 */
export const EXCLUDED_FIELD_NAMES = new Set(['proxyConfiguration']);

export interface ActorMeta {
  slug: string;
  apifyActorId: string;
  /** Path relative to the apify-portfolio root, or null if the actor's real source is not
   *  checked out locally (docs-wrapper actors + page-metadata-extractor) and must be resolved
   *  via the live Apify API instead. */
  localDir: string | null;
  /** Real, observed maximum `stats.runTimeSecs` across every run this actor has ever executed,
   *  pulled live from the Apify API and documented in RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md.
   *  null means the actor has zero production run history — no real number exists to use, so the
   *  OpenAPI adapter must not guess one (see openapi-adapter.ts's decideOpenAPIPattern). */
  maxObservedRuntimeSecs: number | null;
}

export interface ResolvedActorSchema {
  meta: ActorMeta;
  /** How the input schema was actually obtained this run — always disclosed in generated output. */
  inputSchemaSource: 'local-file' | 'live-api';
  inputSchema: ApifyInputSchema;
  datasetSchema: Record<string, unknown> | null;
  datasetSchemaSource: 'local-file' | 'live-api' | 'unavailable';
  /** Real, authoritative title/description pulled from the live Actor API resource — never
   *  hand-authored, so every generated tool description traces to Apify's own record. */
  title: string;
  description: string;
}
