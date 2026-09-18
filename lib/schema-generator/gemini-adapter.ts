import type { ApifyFieldType, ResolvedActorSchema } from './types';
import { mappableFields } from './field-mapper';

const TYPE_MAP: Record<ApifyFieldType, string> = {
  string: 'STRING',
  integer: 'INTEGER',
  number: 'NUMBER',
  boolean: 'BOOLEAN',
  array: 'ARRAY',
  object: 'OBJECT',
};

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: { type: 'OBJECT'; properties: Record<string, unknown>; required?: string[] };
}

/**
 * Gemini's classic function-calling schema is a restricted OpenAPI-3.0 subset: `type` values are
 * UPPERCASE enum strings, and — per a community-reported (not Google-documented) gap — `default`
 * may be silently dropped, so defaults are folded into `description` text instead as a real
 * mitigation (verified live against ai.google.dev/gemini-api/docs/function-calling, 2026-09-18).
 * No `$ref`/`oneOf`/`allOf` are ever emitted; the fleet's real schemas don't use them, and any
 * field that did would need to be flattened upstream rather than silently mis-encoded here.
 */
export function toGeminiFunctionDeclaration(resolved: ResolvedActorSchema): { functionDeclarations: GeminiFunctionDeclaration[] } {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const { name, field, required: isRequired } of mappableFields(resolved.inputSchema)) {
    if (field.type === 'object') {
      throw new Error(`Field "${name}" on ${resolved.meta.slug} is type "object" and survived the EXCLUDED_FIELD_NAMES filter — Gemini's classic schema can't represent nested objects; extend the exclusion list or add real flattening before generating.`);
    }
    let description = field.description ?? field.title ?? name;
    // Only describe "if omitted" behavior for fields that can genuinely be omitted — a required
    // field has no such escape hatch, so claiming a default applies "if omitted" would mislead.
    if (field.default !== undefined && !isRequired) description += ` Default ${JSON.stringify(field.default)} if omitted.`;
    const geminiField: Record<string, unknown> = { type: TYPE_MAP[field.type], description };
    if (field.items) geminiField.items = { type: TYPE_MAP[(field.items.type ?? 'string') as ApifyFieldType] };
    if (field.enum) geminiField.enum = field.enum;
    // minItems/maxItems are on Gemini's own confirmed-supported classic-schema field list;
    // `pattern` is not, so it's deliberately left out here rather than risk an unsupported key.
    if (field.type === 'array') {
      if (field.minItems !== undefined) geminiField.minItems = field.minItems;
      if (field.maxItems !== undefined) geminiField.maxItems = field.maxItems;
    }
    properties[name] = geminiField;
    if (isRequired) required.push(name);
  }

  return {
    functionDeclarations: [
      {
        name: resolved.meta.slug,
        description: resolved.description,
        parameters: { type: 'OBJECT', properties, ...(required.length ? { required } : {}) },
      },
    ],
  };
}
