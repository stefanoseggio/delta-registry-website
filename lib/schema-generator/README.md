# Unified multi-protocol schema generator

Reads each of the 28 real Delta Registry actors' `.actor/input_schema.json` /
`dataset_schema.json` (local checkout if present, live Apify API otherwise — see
`read-actor-schema.ts`) and generates 10 ready-to-use AI-agent tool definitions per actor into
`public/schemas/{slug}/`: OpenAI Chat Completions, OpenAI Responses API, OpenAPI 3.1 (GPT
Actions, sync or async per real observed runtime), Anthropic, Gemini, LangChain (Python + TS),
LlamaIndex (Python), CrewAI (Python), and AG2 (Python).

**Never hand-edit `public/schemas/**` — it is 100% generated output.** Edit the actor's real
`.actor/input_schema.json` (or update `actor-registry.ts` if the fleet itself changed) and
regenerate instead.

## Why this isn't wired into `npm run build`

This project's own `tsconfig.json` is `noEmit: true` with `moduleResolution: "bundler"` (correct
for Next.js, not for standalone `node` execution), and the generator needs filesystem + network
access to sibling actor-repo checkouts that only exist on a developer's machine — it is a
dev-time content-generation step whose OUTPUT gets committed, not a build-time step Vercel runs.

## Regenerating

1. Compile this directory to plain CommonJS with a throwaway tsconfig (not committed — it embeds
   a local output path):

   ```bash
   cat > lib/schema-generator/tsconfig.run.json << 'EOF'
   {
     "compilerOptions": {
       "target": "ES2022", "module": "CommonJS", "moduleResolution": "Node",
       "strict": true, "noUncheckedIndexedAccess": true, "esModuleInterop": true,
       "skipLibCheck": true, "outDir": "<some scratch dir>", "types": ["node"]
     },
     "include": ["*.ts"]
   }
   EOF
   ./node_modules/.bin/tsc -p lib/schema-generator/tsconfig.run.json
   ```

2. Run it with `APIFY_TOKEN` set (`export APIFY_TOKEN=$(apify auth token)`) and, if the actor
   checkouts live somewhere other than two levels above this repo, `APIFY_PORTFOLIO_ROOT`:

   ```bash
   export APIFY_TOKEN=$(apify auth token)
   node <scratch dir>/generate-all.js
   ```

   `APIFY_SCHEMA_OUT_DIR` overrides where output is written (defaults to `public/schemas` next
   to this repo) — only needed because step 1 compiles to a scratch directory, which changes
   `__dirname`-relative path resolution.

3. Validate before committing — this is not optional, it caught a real bug (Python function
   signatures rejecting a required parameter after an optional one, from raw schema property
   order) during development:
   - `python -m py_compile` every generated `.py` file
   - `JSON.parse` / `json.load` every generated `.json` file
   - `npm run typecheck` (the main project's tsconfig excludes `public/schemas` — the generated
     `.ts` snippets reference `langchain`/`zod`, which this site doesn't depend on; typecheck
     them separately against those packages actually installed, e.g. in a throwaway scratch npm
     project)
   - a real OpenAPI 3.1 validator (e.g. `@apidevtools/swagger-parser`) against every
     `openapi.json`

4. `npm run typecheck && npm run lint && npm run build` on the main project.

## Design notes

- **Local file wins over the live API.** `read-actor-schema.ts` reads a checked-out actor's own
  `.actor/input_schema.json` when `actor-registry.ts`'s `localDir` is set; only the 8 actors
  without a local checkout (docs-wrapper repos + `page-metadata-extractor`, which has no git
  repo) hit the API, via each actor's real embedded `sourceFiles` — matched against
  `taggedBuilds.latest.buildNumber`, not `versions[0]` (confirmed live that `versions[0]` can be
  a stale, unused entry).
- **`title`/`description` always come from the live Actor API**, never hand-authored, even for
  actors resolved locally — Apify's own `description` field is the single source of truth.
- **`proxyConfiguration` (and any other Apify-infrastructure-only field) is excluded** from every
  generated schema — see `EXCLUDED_FIELD_NAMES` in `types.ts`. It's a real, observed field
  (`cordoba-compras-monitor`, `pba-tenders-monitor`), not a hypothetical; exposing Apify proxy
  routing as an LLM-callable parameter would be meaningless to an external caller.
- **The GPT Actions sync-vs-async OpenAPI path is decided per actor from real observed runtime
  data** (`RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md`'s telemetry, wired into `actor-registry.ts`),
  not guessed — Apify's `run-sync-get-dataset-items` allows up to 300s but GPT Actions enforces a
  45s cap. Actors with no production run history default to the conservative async pattern.
- **OpenAI strict mode requires every property in `required`**, with optional fields expressed as
  a nullable type union instead of omission. **Anthropic and Gemini do not** — a shared converter
  that assumed one strict-mode dialect fits all three would be wrong for two of them.
- **OpenAI's function `name` uses the bare actor slug**, not the `stefano_seggio--` MCP-prefixed
  form — checked against the fleet's real, live MCP tool names, the prefixed form leaves only 2
  characters of headroom under OpenAI's 64-char limit on the longest actor name.
