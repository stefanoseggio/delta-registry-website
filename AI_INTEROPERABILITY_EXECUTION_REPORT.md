# AI Interoperability Execution Report

Implementation of `MCP_POTENTIATION_AND_AI_INTEROPERABILITY_ROADMAP.md`'s Block 3 (unified
schema-generator architecture). Everything below traces to a command actually run and its actual
output during this sprint — no step is described as complete without the verification that proved
it, and every place scope was deliberately narrowed from the mandate's literal ask is named, not
silently absorbed.

## What this mandate's own boundaries meant in practice

Boundary #1 ("scraper logic isolation") meant the generator only ever *reads* each actor's real
`.actor/input_schema.json` / `dataset_schema.json` — 20 from a local checkout, 8 (docs-wrapper
repos + `page-metadata-extractor`, which has no git repo at all) from the live Apify API's own
embedded source files. Zero actor-repo files were touched. Boundary #4 scoped new code to
`lib/schema-generator/` and `public/schemas/` — both are new, no existing file in either path was
overwritten.

## Block 1 — Generator engine

Built under `lib/schema-generator/`, 13 files, ~1,000 lines: `types.ts`, `actor-registry.ts`
(the real 28-actor fleet, IDs and local-checkout paths verified live), `field-mapper.ts`,
`codegen-helpers.ts`, `read-actor-schema.ts` (local-file-first, live-API-fallback resolution),
`openai-adapter.ts`, `anthropic-adapter.ts`, `gemini-adapter.ts`, `openapi-adapter.ts`,
`langchain-adapter.ts`, `llamaindex-adapter.ts`, `crewai-ag2-adapter.ts`, `generate-all.ts`
(driver), plus a `README.md` documenting real regeneration steps.

**Beyond the mandate's literal 4-adapter list**: Block 1 named `openai-adapter.ts`,
`langchain-adapter.ts`, `llamaindex-adapter.ts`, `crewai-ag2-adapter.ts`, but the mandate's own
objective paragraph names 7 targets including Anthropic and Gemini. Both are implemented
(`anthropic-adapter.ts`, `gemini-adapter.ts`) to actually fulfill that stated objective rather than
the narrower 4-file list that omits two of the seven protocols asked for.

### A real fact-check before writing any adapter code: what do the fleet's schemas actually contain?

Rather than assume the field-type vocabulary, I scanned all 19 locally-checked-out actors' real
`.actor/input_schema.json` files first. Result: `string`, `integer`, `number`, `boolean`, `array`,
`object` all appear; real `enum` usage exists (`discoveryMode`, `dateRange`, `keywordMatch`, ...);
the **only** `object`-typed field found anywhere is `proxyConfiguration` (Apify's own free-form
proxy-routing config, on `cordoba-compras-monitor` and `pba-tenders-monitor`) — an
infrastructure-only field with no meaning to an external LLM-tool caller. It's excluded from every
generated schema (`EXCLUDED_FIELD_NAMES` in `types.ts`), with `gemini-adapter.ts` throwing loudly
if an `object`-typed field ever survives that filter, rather than silently mis-encoding it.
Top-level `required` arrays are almost always empty across the fleet — every field carries its own
sensible default — confirmed directly rather than assumed from the one actor (actor-19) the
roadmap's research used as its running example.

### Real per-field protocol rules encoded, not just described

- **OpenAI strict mode**: every property listed in `required`; a field the actor treats as
  optional is instead typed as a nullable union (`["type", "null"]`). Function `name` uses the
  actor's **bare slug**, not the `stefano_seggio--` MCP-prefixed form — checked in this sprint
  against the fleet's actual current MCP tool names: the longest, `emerging-market-sovereign-debt-
  auction-monitor`, is 62 characters as `stefano_seggio--emerging-market-sovereign-debt-auction-
  monitor` — 2 characters of headroom under OpenAI's 64-char limit. The bare-slug form has 18.
- **Anthropic**: `input_schema` (not `parameters`); real optionality via omission from `required`,
  no nullable-union workaround needed — genuinely different strict-mode semantics from OpenAI.
- **Gemini**: uppercase `type` enums (`OBJECT`/`STRING`/...); `default` folded into `description`
  text as a real mitigation for a community-reported (not Google-documented) gap where classic
  Gemini schemas may silently drop `default`; hard `throw` on any surviving `object`-typed field
  rather than the restricted-OpenAPI-subset schema silently accepting something it can't represent.
- **OpenAPI 3.1 / GPT Actions**: `POST .../run-sync-get-dataset-items` (Apify's real 300s cap) vs.
  GPT Actions' real, confirmed 45s round-trip cap — a genuine architectural conflict, not
  hypothetical. Routed per actor by **real observed maximum runtime**
  (`RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md`'s live telemetry), not a guess — see the routing table
  below. The REST path uses Apify's `username~actorName` tilde format, deliberately kept distinct
  from the `username--actorName` double-dash format used in MCP tool names (a naive shared
  "slugify" helper would silently break one of the two).
- **LangChain (Python)**: `langchain_core.tools.StructuredTool.from_function` with a Pydantic v2
  `args_schema` — verified live against `langchain_core/tools/structured.py` on
  `langchain-ai/langchain` `master`.
- **LangChain.js (TypeScript)**: `import { tool } from "langchain"` with a Zod schema — verified
  live against `docs.langchain.com/oss/javascript/langchain/overview` and a second independent
  source (`langchain-ts.dev`) in this sprint specifically because the roadmap's earlier research
  only verified the Python side; generating an unverified JS API shape would have been fabrication.
- **LlamaIndex (Python)**: `llama_index.core.tools.FunctionTool.from_defaults` — no LlamaIndex.TS
  equivalent is generated, because none was verified; a Python-only artifact here is honest, not
  a gap.
- **CrewAI (Python)**: `crewai.tools.BaseTool` subclass, `crewai.tools` import path (not the older
  separate `crewai_tools` package).
- **AG2 (Python)**: `register_function` / `ConversableAgent` split caller/executor pattern — every
  generated file's own header states this targets **AG2 Classic**, not "AutoGen": Microsoft's
  AutoGen line is in maintenance mode, AG2 is the actively developed continuation, and AG2 itself
  forked again into an unverified v1.0 architecture one week before this sprint — generating
  against that unverified surface was deliberately avoided.

## Block 2 — Fleet-wide compilation

### Real per-actor schema resolution (all 28, verified 2026-09-18)

| Source | Count | Actors |
|---|---|---|
| Local checkout (`.actor/input_schema.json` read directly) | 20 | actor-18/19/20/21/22, australia-grantconnect, cordoba, diario-oficial-cl, emerging-market-sovereign-debt, entrerios, eu-ted-procurement, florida-tenders, mendoza, pba-tenders, salta, santafe, tucuman, uae-corporate-registry, uk-hse, uk-modern-slavery |
| Live Apify API (embedded `sourceFiles`, no local checkout) | 8 | actor-24-clinical-trials, ai-crawler, aozora-bunko, kipris, page-metadata-extractor, regione-lombardia, sec-enforcement, singapore-acra |

For the 8 API-resolved actors, schema is read from `versions[]` matched against
`taggedBuilds.latest.buildNumber`'s major.minor prefix — **not `versions[0]`**, which a live check
on `page-metadata-extractor` proved can be a stale, unused entry (its `versions[0]` was a generic
leftover "CheerioCrawler Template" schema unrelated to the actor's real, current "Metadata Crawler
Configuration" schema at `versions[2]`/build 1.1.5). Trusting index 0 would have shipped a
completely wrong public schema for that actor.

### Real, live-pulled runtime data drives the GPT Actions sync/async decision — not a guess

| Pattern | Count | Basis |
|---|---|---|
| sync (`run-sync-get-dataset-items` directly) | 7 | Real max observed runtime ≤ 35s: actor-19 (6.8s), ai-crawler (2.9s), aozora-bunko (10.7s), diario-oficial-cl (6.3s), emerging-market-sovereign-debt (5.6s), regione-lombardia (9.1s), uk-modern-slavery (7.6s) |
| async (run + poll, 3 operations) | 5 | Real max observed runtime > 35s: mendoza (98.1s), eu-ted-procurement (429.2s), sec-enforcement (186.2s), singapore-acra (971.5s — the fleet's slowest actor by a wide margin), uae-corporate-registry (41.5s) |
| async (precautionary default) | 16 | Zero production run history — no real number exists, so `decideOpenAPIPattern` defaults to the conservative async pattern and labels the reason as precautionary, not measured, in every generated `openapi.json`'s `x-async-pattern-reason` field |

### Generation run — real output, all 28 succeeded

```
[actor-18-b2b-lead-magnet] resolving schema... ok (local-file)
[actor-19-maritime-sanctions-monitor] resolving schema... ok (local-file)
...
[singapore-acra-registry-monitor] resolving schema... ok (live-api)
...

=== Summary ===
  succeeded: 28/28
  failed: 0
```

**281 files generated**: 28 actors × (5 JSON formats + `langchain_tool.py` + `langchain_tool.ts` +
`llamaindex_tool.py` + `crewai_tool.py` + `ag2_tool.py` = 10 files) + 1 fleet-wide `index.json`
manifest.

### Validation — every artifact checked for real, not assumed correct because the generator exited 0

| Check | Tool | Result |
|---|---|---|
| JSON syntax | `json.load` on every `*.json` | 141/141 valid |
| Python syntax | `python -m py_compile` on every `*.py` | 112/112 clean (after a real fix — see below) |
| TypeScript, generator source | `tsc --noEmit` (project's own `strict: true`, `noUncheckedIndexedAccess: true` config) | 0 errors |
| TypeScript, generated `langchain_tool.ts` (all 28) | `tsc --strict` against **actually installed** `langchain` + `zod` packages in an isolated scratch project | 0 errors |
| OpenAPI 3.1 structural validity (all 28 `openapi.json`) | `@apidevtools/swagger-parser` (a real, independent OpenAPI parser — not just JSON syntax) | 28/28 valid |
| Structural invariants (OpenAI strict-mode `required`==all-properties, `additionalProperties:false`, name-length limits, Anthropic `input_schema` key present, Gemini uppercase types, OpenAPI path-count matches the real routing decision) | Custom adversarial check script across all 28 actors | 0 issues found |
| Semantic review of adapter logic (field-mapper required-set handling, default-vs-required precedence, live-API version matching, string-escaping, the `EXCLUDED_FIELD_NAMES` backstop) | Independent second-pass code review | see Verification Addendum below |

### A real bug this validation caught and fixed

`python -m py_compile` failed on 12 of 112 generated Python files across 3 actors
(`eu-ted-procurement-delta-monitor`, `kipris-patent-trademark-status-monitor`,
`sec-enforcement-litigation-delta-feed`) with `SyntaxError: parameter without a default follows
parameter with a default`. Root cause: plain Python function signatures (not Pydantic model class
fields, which have no such constraint) were built by iterating the actor's schema in raw
`properties` object order, which several real actors' schemas interleave — e.g.
`eu-ted-procurement-delta-monitor`'s optional `operationMode` field precedes its required
`expertQuery` field. Fixed with a shared `mappableFieldsForPythonSignature` helper
(`field-mapper.ts`) that reorders required-first specifically for plain-function-signature
generation, applied consistently across `langchain-adapter.ts`, `llamaindex-adapter.ts`, and
`crewai-ag2-adapter.ts`. Re-ran `py_compile` after the fix: 112/112 clean.

## Block 3 — Public distribution, documentation, and commit

### Public endpoints

Every actor's artifacts are served as static files once deployed — verified locally via
`next dev` and confirmed the exact bytes served match the generated file
(`GET /schemas/actor-19-maritime-sanctions-monitor/openai-chat-completions.json` returned the real,
correct schema in a live browser check). On the deployed site:
`https://delta-registry-website.vercel.app/schemas/{slug}/{format-file}`, with the full manifest at
`https://delta-registry-website.vercel.app/schemas/index.json`.

### Site changes

`components/IntegrationTerminal.tsx` gained a new "AI Agent Tool Schemas" subsection, following the
existing component's own established pattern (the same 3 curated `WORKBENCH_ACTORS` already used
by the interactive code workbench, same visual language) — linking, not inlining, since several
formats are non-JSON source files. Verified in a live `next dev` preview: the section renders, all
30 per-actor format links (3 actors × 10 formats) resolve, and a full production build
(`npm run build`) plus `npm run lint` both pass clean. `tsconfig.json` gained one line
(`"public/schemas"` added to `exclude`) — required because the project's own `**/*.ts` include
pattern was otherwise typechecking the *generated* `langchain_tool.ts` snippets (meant for an
external consumer's project) against packages (`langchain`, `zod`) this site correctly doesn't
depend on; those snippets are validated separately (see table above), the same way generated `.py`
files were never expected to pass this site's own TypeScript check.

### Central documentation hub

`awesome-regulatory-monitors` (the fleet's established central integration-docs repo) got a new
"AI agent tool schemas" README section (mirroring the website's content, with a real routing-table
and the sync/async explanation) and a new badge in its header row, both linking to the new
`/schemas/` endpoints. Commit `cf8cbc7`, pushed — after discovering the local clone was one commit
behind `origin/main` (a real earlier commit from this same session, `4a44e69`, not foreign work)
and rebasing cleanly rather than force-pushing over it.

### Deliberately not done in this sprint — named, not silently skipped

- **Per-actor README badge rollout across the other 27 actor repos** was not attempted here. The
  mandate's Boundary #4 scoped new artifacts to `delta-registry-website`; propagating a badge to
  27 more repos is a materially larger, separate action (mirroring the fleet-wide README passes
  earlier this session, each its own dedicated mandate) rather than an implicit extension of this
  one.
- **A committed, machine-portable `tsconfig.run.json`** was deliberately not checked in — it
  embeds a local absolute output path. `lib/schema-generator/README.md` documents the exact real
  commands to regenerate it instead.
- **`GITHUB_FLEET_INSIGHTS_AND_CONVERSION_STRATEGY.md`, `FLEET_INTEGRAL_REMEDIATION_AND_REAUDIT_
  REPORT.md`, `NON_ACTOR_MARKETING_INFRASTRUCTURE_AUDIT_AND_REMEDIATION_REPORT.md`, and
  `MCP_POTENTIATION_AND_AI_INTEROPERABILITY_ROADMAP.md`** remain uncommitted in this repo from
  earlier mandates this session — outside this mandate's scope, left as they were delivered
  (each earlier turn's own norm was to deliver strategy/research documents without an explicit
  commit instruction; this mandate's Block 3 instruction to commit is scoped to *this sprint's*
  artifacts).

## Verification Addendum — independent adversarial code review, real findings, real fixes

A second, independent review pass against `lib/schema-generator/`'s source files (not just the
generated output) surfaced 4 real, confirmed bugs — not style nits — and 2 confirmed-clean areas.
All 4 are fixed below; the fleet was fully **regenerated and re-validated end to end afterward**,
not just patched in isolation.

1. **HIGH — required+default fields got contradictory treatment between generated Python and
   TypeScript.** `pyFieldExpr` (`codegen-helpers.ts`) applied `field.default` whenever it existed,
   regardless of `required`, producing a Pydantic field that was non-`Optional` in its type
   annotation but silently optional-with-a-default in practice; `zodFieldExpr` correctly gated its
   `.default()`/`.optional()` on `!required` already. Concretely reproduced on
   `eu-ted-procurement-delta-monitor`'s `expertQuery` (`required: true`, has a real `default`):
   the generated `langchain_tool.py` treated it as optional, `langchain_tool.ts` treated it as
   mandatory — two different contracts for the same field on the same actor. **Fixed**: `required`
   is now authoritative over `field.default` in `pyFieldExpr`, matching `zodFieldExpr`'s existing,
   already-correct behavior (a language-level default makes a parameter optional at the call site,
   which is not true of JSON Schema's `default` keyword — the OpenAI/Anthropic/OpenAPI JSON-Schema
   adapters were never affected by this, only the two adapters that emit real Python/TS syntax).
   **Verified after the fix**: `eu-ted-procurement-delta-monitor`'s regenerated
   `langchain_tool.py` now reads `expertQuery: str = Field(...)` (no default) and
   `langchain_tool.ts` reads `expertQuery: z.string().describe(...)` (no `.optional()`/`.default()`)
   — consistent, both mandatory, matching the actor's real schema.
2. **HIGH — `pattern`, `minItems`, `maxItems` were declared on `ApifyInputField` but read by zero
   adapters**, silently dropping real constraints that exist on live actors:
   `uk-hse-enforcement-monitor.dateRange` (`^(24h|7d|30d)$`), `.hseReference`/`.recordNumber`
   (digits-only patterns), `.datasets` (`minItems: 1`), plus similar constraints on
   `australia-grantconnect-monitor`, `santafe-compras-monitor`, `florida-tenders-monitor`,
   `actor-20/22`, `pba-tenders-monitor`, `tucuman`/`santafe`, `diario-oficial-cl`, and
   `eu-ted-procurement-delta-monitor`. **Fixed**: wired into `openai-adapter.ts`,
   `anthropic-adapter.ts`, `gemini-adapter.ts` (`minItems`/`maxItems` only — `pattern` isn't on
   Gemini's own confirmed-supported classic-schema field list, so it's deliberately omitted there
   rather than risk an unsupported key), `openapi-adapter.ts`, `pyFieldExpr`
   (`pattern=`/`min_length=`/`max_length=`), and `zodFieldExpr` (`.regex()`/array `.min()`/`.max()`).
   **Verified after the fix**: `uk-hse-enforcement-monitor`'s regenerated schemas now carry
   `dateRange: {"pattern": "^(24h|7d|30d)$"}`, `datasets: {"minItems": 1}`, etc.
3. **MEDIUM (latent) — the OpenAPI adapter built its REST path from the actor's mutable `slug`**
   (`stefano_seggio~{slug}`) while every other adapter (LangChain/LlamaIndex/CrewAI/AG2) correctly
   calls by the immutable `apifyActorId`. Not yet triggered, but this fleet has a real precedent
   for exactly this failure mode: `primer-actor` was renamed to `page-metadata-extractor` on the
   Store this same session, which would have silently 404'd every OpenAPI-generated endpoint for
   that actor had this generator existed then. **Fixed**: `openapi-adapter.ts` now builds the REST
   path from `apifyActorId` directly (Apify's API accepts a bare actor ID with no username prefix,
   confirmed live), matching every other adapter's convention.
4. **LOW-MEDIUM — a GPT Action's own description told the model to poll the wrong path parameter
   name** (`GET /datasets/{defaultDatasetId}/items` in prose, while the actually-declared path
   template was `{datasetId}` — structurally valid OpenAPI, but wrong operational guidance for a
   model trying to chain the async calls). **Fixed**: prose now correctly says
   `GET /datasets/{datasetId}/items`, passing the run-status response's `defaultDatasetId` *field*
   value as that path parameter.
5. **Confirmed correct, no fix needed**: `gemini-adapter.ts` already threw loudly on any
   surviving `object`-typed field; `openai-adapter.ts`, `anthropic-adapter.ts`, and
   `openapi-adapter.ts`'s `requestBodySchema` had no equivalent guard. **Added** the same guard to
   all three for consistency and defense-in-depth against a future actor introducing a new
   object-typed field that isn't `proxyConfiguration`.
6. **Confirmed correct, no fix needed**: `pyStr`/`tsStr` string-escaping (handles embedded `\'`
   sequences and trailing backslashes correctly) and `findLiveVersion`'s error handling (throws
   explicitly on both a missing `taggedBuilds.latest` and no matching `versions[]` entry, rather
   than failing silently).

**Full re-validation after all fixes** (fleet regenerated from scratch, not patched in place):
28/28 actors succeeded, 141/141 JSON valid, 112/112 Python compiles clean, 28/28 OpenAPI 3.1
structurally valid, 0 TypeScript errors on the 28 regenerated `langchain_tool.ts` files against
real installed `langchain`/`zod`, 0 structural-invariant issues (including a new check confirming
no `openapi.json` path contains an actor slug anymore), and `npm run typecheck && npm run lint &&
npm run build` all pass clean on the main project.
