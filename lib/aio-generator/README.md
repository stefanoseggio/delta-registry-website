# AIO / MCP registry file generator

Generates `public/llms.txt`, `public/llms-full.txt`, and `public/mcp-server.json` from this
repo's own real data — `lib/actors.ts` (the fleet), `lib/schema-generator/actor-registry.ts` (Apify
actor IDs, for the MCP manifest's tool-scoping URL), and the already-committed
`public/schemas/{slug}/openapi.json` files (for `llms-full.txt`'s per-actor field documentation).

**Never hand-edit these three output files** — they are 100% generated. Update `lib/actors.ts` or
re-run `lib/schema-generator/` first, then regenerate.

## Why `robots.txt` and `sitemap.xml` are NOT generated here

Those two use Next.js's own native `app/robots.ts` / `app/sitemap.ts` convention instead — the
correct, idiomatic choice specifically because Next.js has first-class, well-tested support for
them (right `Content-Type`, static prerendering, seamless `next build`/Vercel behavior).
`app/sitemap.ts` imports `ACTORS` from `lib/actors.ts` directly — no separate generation step
needed, since it's just another Next.js route evaluated at build/request time.

## Regenerating

Same pattern as `lib/schema-generator/` — this project's own `tsconfig.json` is `noEmit: true`
with `moduleResolution: "bundler"` (correct for Next.js, wrong for standalone `node` execution),
so compile to a scratch CommonJS build first:

```bash
cat > tsconfig.aio-run.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022", "module": "CommonJS", "moduleResolution": "Node",
    "strict": true, "noUncheckedIndexedAccess": true, "esModuleInterop": true,
    "skipLibCheck": true, "outDir": "<scratch dir>", "types": ["node"]
  },
  "include": ["lib/aio-generator/*.ts", "lib/actors.ts", "lib/types.ts",
              "lib/schema-generator/actor-registry.ts", "lib/schema-generator/types.ts"]
}
EOF
./node_modules/.bin/tsc -p tsconfig.aio-run.json   # do not commit tsconfig.aio-run.json
node <scratch dir>/lib/aio-generator/generate-aio-files.js
```

`llms-full.txt` reads each actor's `public/schemas/{slug}/openapi.json` via `fs.readFileSync`
relative to `APIFY_SCHEMA_OUT_DIR_ROOT` (defaults to this repo's own `public/`, matching
`lib/schema-generator`'s `APIFY_SCHEMA_OUT_DIR` convention) — so `lib/schema-generator/` must be
run first if the schemas don't already exist.

## Real corrections this generator exists specifically to prevent recurring

`mcp-server.json`'s `remotes[0].url` was hand-typed once, incorrectly, in an earlier pass of this
sprint (`MARKET_DOMINANCE_AND_REVENUE_POTENTIATION_ROADMAP.md`'s first draft used
`https://mcp.apify.com/sse?actors=...` — both the query parameter name and the `/sse` path were
wrong, caught by checking Apify's current docs directly: the real, current format is
`https://mcp.apify.com?tools=username/slug,...`, Streamable HTTP, no `/sse` — SSE transport was
retired 2026-04-01). Deriving the URL from `ACTOR_REGISTRY` instead of typing 28 slugs by hand
makes that specific class of error structurally harder to repeat, though the query-parameter-name
and transport-path facts themselves still need to be re-verified against Apify's docs if their API
changes again — this generator can't protect against Apify itself changing the contract.
