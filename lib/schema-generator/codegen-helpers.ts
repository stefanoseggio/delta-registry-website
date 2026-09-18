import type { ApifyInputField } from './types';

/** Safe Python single-quoted string literal (handles quotes, backslashes, newlines). */
export function pyStr(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

/** Safe TypeScript double-quoted string literal. */
export function tsStr(s: string): string {
  return JSON.stringify(s);
}

function pyScalarType(t: string): string {
  switch (t) {
    case 'string':
      return 'str';
    case 'integer':
      return 'int';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    default:
      throw new Error(`pyScalarType: unmapped Apify field type "${t}"`);
  }
}

/** Pydantic v2 type annotation for one field, honoring array-of-scalar and Optional wrapping. */
export function pyFieldAnnotation(field: ApifyInputField, required: boolean): string {
  let inner: string;
  if (field.type === 'array') {
    const itemType = pyScalarType(field.items?.type ?? 'string');
    inner = `list[${itemType}]`;
  } else {
    inner = pyScalarType(field.type);
  }
  return required ? inner : `Optional[${inner}]`;
}

/**
 * Pydantic v2 `Field(...)` call for one field — real default, description, and constraints.
 *
 * `required` is authoritative over `field.default`: a language-level default makes a Python
 * parameter (and a Zod field, in zodFieldExpr below) optional at the call site, which is NOT
 * true of JSON Schema's `default` keyword (informational there, independent of `required`). A
 * field the actor's own schema marks required must stay required here even if it also carries a
 * `default` — confirmed live on eu-ted-procurement-delta-monitor's `expertQuery` (required=true,
 * has a real default) via an adversarial code review that caught this generator applying the
 * default anyway and silently making the field optional, contradicting the actor's own contract.
 */
export function pyFieldExpr(field: ApifyInputField, required: boolean): string {
  const parts: string[] = [];
  const def = !required ? (field.default !== undefined ? JSON.stringify(field.default) : 'None') : undefined;
  if (def !== undefined) parts.push(`default=${pyLiteral(def)}`);
  else parts.push('...');
  if (field.minimum !== undefined) parts.push(`ge=${field.minimum}`);
  if (field.pattern !== undefined) parts.push(`pattern=${pyStr(field.pattern)}`);
  if (field.type === 'array') {
    if (field.minItems !== undefined) parts.push(`min_length=${field.minItems}`);
    if (field.maxItems !== undefined) parts.push(`max_length=${field.maxItems}`);
  }
  if (field.description) parts.push(`description=${pyStr(field.description)}`);
  return `Field(${parts.join(', ')})`;
}

function pyLiteral(jsonLiteral: string): string {
  // JSON true/false/null -> Python True/False/None; everything else (numbers, quoted strings) is valid as-is.
  if (jsonLiteral === 'true') return 'True';
  if (jsonLiteral === 'false') return 'False';
  if (jsonLiteral === 'null') return 'None';
  return jsonLiteral;
}

function zodScalar(t: string): string {
  switch (t) {
    case 'string':
      return 'z.string()';
    case 'integer':
      return 'z.number().int()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    default:
      throw new Error(`zodScalar: unmapped Apify field type "${t}"`);
  }
}

/** Zod schema expression for one field, matching the real `langchain` package's `tool()` config.schema shape. */
export function zodFieldExpr(field: ApifyInputField, required: boolean): string {
  let expr = field.type === 'array' ? `z.array(${zodScalar(field.items?.type ?? 'string')})` : zodScalar(field.type);
  if (field.enum) {
    const literals = field.enum.map((v) => tsStr(v)).join(', ');
    expr = `z.enum([${literals}])`;
  }
  if (field.pattern !== undefined) expr += `.regex(new RegExp(${tsStr(field.pattern)}))`;
  if (field.type === 'array') {
    if (field.minItems !== undefined) expr += `.min(${field.minItems})`;
    if (field.maxItems !== undefined) expr += `.max(${field.maxItems})`;
  } else if (field.minimum !== undefined) {
    expr += `.min(${field.minimum})`;
  }
  if (field.description) expr += `.describe(${tsStr(field.description)})`;
  // `required` is authoritative over `field.default` — see the matching note on pyFieldExpr above.
  if (!required) {
    expr += field.default !== undefined ? `.default(${JSON.stringify(field.default)})` : '.optional()';
  }
  return expr;
}
