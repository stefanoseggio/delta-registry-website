import type { ApifyInputField, ApifyInputSchema } from './types';
import { EXCLUDED_FIELD_NAMES } from './types';

export interface MappedField {
  name: string;
  field: ApifyInputField;
  required: boolean;
}

/**
 * Single shared pass over an actor's real input schema: drops Apify-infrastructure-only fields
 * (see EXCLUDED_FIELD_NAMES) and resolves which fields are actually required, so every protocol
 * adapter sees the same, consistent field list rather than re-implementing this filter and
 * risking drift between them.
 */
export function mappableFields(schema: ApifyInputSchema): MappedField[] {
  const requiredSet = new Set(schema.required ?? []);
  return Object.entries(schema.properties)
    .filter(([name]) => !EXCLUDED_FIELD_NAMES.has(name))
    .map(([name, field]) => ({ name, field, required: requiredSet.has(name) }));
}

/**
 * Same fields, reordered required-first. Python (and Python-lineage AG2) function signatures
 * reject a non-default parameter following a defaulted one — a real bug this generator hit on
 * `eu-ted-procurement-delta-monitor` (optional `operationMode` precedes required `expertQuery` in
 * the actor's own real schema property order) and `kipris-...`/`sec-enforcement-...`, caught by
 * running `python -m py_compile` on the actual generated output, not assumed safe. Use this
 * specifically for generated PLAIN FUNCTION signatures (`def f(a, b=None)`); Pydantic model class
 * fields (`class X(BaseModel): a: int; b: Optional[int] = None`) have no such ordering constraint
 * and should keep using mappableFields()'s original schema order.
 */
export function mappableFieldsForPythonSignature(schema: ApifyInputSchema): MappedField[] {
  const fields = mappableFields(schema);
  return [...fields.filter((f) => f.required), ...fields.filter((f) => !f.required)];
}

/** OpenAI's 64-char, `a-zA-Z0-9_-`-only function name rule (verified live, 2026-09-18). */
export function assertValidOpenAIName(name: string): void {
  if (name.length > 64) {
    throw new Error(`"${name}" (${name.length} chars) exceeds OpenAI's 64-char function name limit.`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`"${name}" contains characters outside OpenAI's allowed a-zA-Z0-9_- set.`);
  }
}

/** Anthropic's 128-char, `a-zA-Z0-9_-`-only tool name rule (verified live, 2026-09-18). */
export function assertValidAnthropicName(name: string): void {
  if (name.length > 128) {
    throw new Error(`"${name}" (${name.length} chars) exceeds Anthropic's 128-char tool name limit.`);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`"${name}" contains characters outside Anthropic's allowed a-zA-Z0-9_- set.`);
  }
}

/** A valid Python identifier — used for generated function/class names across the Python adapters. */
export function toPythonIdentifier(slug: string): string {
  const id = slug.replace(/-/g, '_');
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) {
    throw new Error(`"${slug}" does not produce a valid Python identifier ("${id}").`);
  }
  return id;
}

/** OpenAI's 300-char summary / 700-char parameter-description limits (GPT Actions, verified live). */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}
