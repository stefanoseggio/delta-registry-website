import type { ResolvedActorSchema } from './types';
import { mappableFields, assertValidAnthropicName } from './field-mapper';

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Anthropic keeps `default` values and allows fields to be genuinely absent from `required` —
 * no nullable-union workaround needed, unlike OpenAI strict mode (verified live against
 * platform.claude.com's tool-use docs, 2026-09-18; `docs.anthropic.com` 301-redirects there now).
 * Field name is `input_schema`, not `parameters` — the single most common bug a naive shared
 * converter hits when porting an OpenAI-shaped schema over.
 */
export function toAnthropicTool(resolved: ResolvedActorSchema): AnthropicTool {
  assertValidAnthropicName(resolved.meta.slug);

  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const { name, field, required: isRequired } of mappableFields(resolved.inputSchema)) {
    if (field.type === 'object') {
      throw new Error(`Field "${name}" on ${resolved.meta.slug} is type "object" and survived the EXCLUDED_FIELD_NAMES filter — extend the exclusion list or add real handling before generating.`);
    }
    const clean: Record<string, unknown> = { type: field.type, description: field.description ?? field.title ?? name };
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

  return {
    name: resolved.meta.slug,
    description: resolved.description,
    input_schema: { type: 'object', properties, required },
  };
}
