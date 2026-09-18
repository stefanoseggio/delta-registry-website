import type { ResolvedActorSchema } from './types';
import { mappableFields, assertValidOpenAIName } from './field-mapper';

export interface OpenAIFunctionDef {
  name: string;
  description: string;
  strict: true;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
}

/**
 * OpenAI strict mode requires every property to be listed in `required`; a field the actor
 * itself treats as optional is instead made nullable via a ["type","null"] union rather than
 * omitted from `required` — there is no "optional by omission" in strict mode (verified live
 * against OpenAI's current function-calling + strict-mode docs, 2026-09-18).
 *
 * `name` uses the actor's bare slug, NOT the `stefano_seggio--` MCP-style prefix: checked
 * against all 28 real, live MCP tool names, the prefixed form leaves only 2 characters of
 * headroom under OpenAI's 64-char limit on the fleet's longest actor name, and OpenAI function
 * names are scoped to the request (no need for a username namespace).
 */
export function toOpenAIFunction(resolved: ResolvedActorSchema): OpenAIFunctionDef {
  assertValidOpenAIName(resolved.meta.slug);

  const properties: Record<string, unknown> = {};
  for (const { name, field, required } of mappableFields(resolved.inputSchema)) {
    if (field.type === 'object') {
      throw new Error(`Field "${name}" on ${resolved.meta.slug} is type "object" and survived the EXCLUDED_FIELD_NAMES filter — extend the exclusion list or add real handling before generating.`);
    }
    const clean: Record<string, unknown> = { type: field.type, description: field.description ?? field.title ?? name };
    if (field.enum) clean.enum = field.enum;
    if (field.items) {
      clean.items = field.enum || !field.items.enum ? { type: field.items.type ?? 'string', ...(field.items.enum ? { enum: field.items.enum } : {}) } : field.items;
    }
    if (field.pattern !== undefined) clean.pattern = field.pattern;
    if (field.type === 'array') {
      if (field.minItems !== undefined) clean.minItems = field.minItems;
      if (field.maxItems !== undefined) clean.maxItems = field.maxItems;
    } else if (field.minimum !== undefined) {
      clean.minimum = field.minimum;
    }
    // Strict mode doesn't enforce `default`, and a required field can't actually be omitted (it
    // has no nullable-null escape hatch below) — only describe "if omitted" behavior for fields
    // that can genuinely be omitted, so the prose never contradicts what the schema allows.
    if (field.default !== undefined && !required) {
      clean.description = `${clean.description} Default ${JSON.stringify(field.default)} if omitted.`;
    }
    if (!required) {
      clean.type = [field.type, 'null'];
    }
    properties[name] = clean;
  }

  return {
    name: resolved.meta.slug,
    description: resolved.description,
    strict: true,
    parameters: {
      type: 'object',
      properties,
      required: Object.keys(properties), // strict mode: ALL keys, not just the actor's own required[]
      additionalProperties: false,
    },
  };
}

export function toOpenAIChatCompletionsTool(resolved: ResolvedActorSchema) {
  return { type: 'function' as const, function: toOpenAIFunction(resolved) };
}

export function toOpenAIResponsesTool(resolved: ResolvedActorSchema) {
  return { type: 'function' as const, ...toOpenAIFunction(resolved) };
}
