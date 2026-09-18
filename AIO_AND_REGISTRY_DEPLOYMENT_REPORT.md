# AIO System Files & MCP Registry Distribution — Deployment Report

Every claim below traces to a command actually run and its actual output, or a real fetch against
`delta-registry-website`'s own dev server / Smithery's live dashboard — not asserted because the
generator exited 0.

## A correction resolved before this sprint, and one caught mid-sprint

This sprint's own mandate text (and, separately, an early draft written for
`MARKET_DOMINANCE_AND_REVENUE_POTENTIATION_ROADMAP.md`) used
`https://mcp.apify.com/?actors=stefano_seggio/...` as the real MCP endpoint format. Checked live
against `docs.apify.com/integrations/mcp` before generating anything: the real, current query
parameter is **`tools`**, not `actors`, and the base URL has **no `/sse` path** — SSE transport was
retired by Apify on 2026-04-01 (already passed as of this session), replaced by Streamable HTTP at
the bare `https://mcp.apify.com` origin. Every generated artifact in this report uses the corrected
form, derived from `lib/schema-generator/actor-registry.ts`'s real 28-actor list rather than
hand-typed, specifically so this exact class of error (a single wrong character in a 1,340-character
URL) can't silently recur.

## Block 1 — AIO architecture & LLM indexing system files

### `robots.txt` — real, Next.js-native, verified served

Built as `app/robots.ts` (Next.js's own `MetadataRoute.Robots` convention — chosen over a static
`public/robots.txt` file specifically because it has first-class, tested support for the correct
`Content-Type` and build-time prerendering). Explicit `Allow: /` rules for the mandate's 5 named
crawlers (GPTBot, ClaudeBot, PerplexityBot, Bytespider, Applebot-Extended) plus 5 more, disclosed as
a deliberate addition: `ChatGPT-User`, `OAI-SearchBot`, `Claude-User`, `Claude-SearchBot`,
`Perplexity-User` — live, user-triggered fetch crawlers (not training crawlers), directly relevant
to this site's actual AIO goal of being fetchable *during* a conversation, not just indexed for
model training. A `Sitemap:` pointer closes the file.

**Verified live** (`http://localhost:3000/robots.txt`, dev server): all 11 `User-Agent` blocks
present with `Allow: /`, sitemap line correct. `next build` confirms `/robots.txt` compiles as a
real static route (`○ Static`, 0 B — Next.js serves it generated, not from a file).

### `sitemap.xml` — real, derived from live fleet data, structurally validated

Built as `app/sitemap.ts`, importing `ACTORS` directly from `lib/actors.ts` — no separate
generation step, no hand-typed slug list to drift. 5 static entries (homepage, `llms.txt`,
`llms-full.txt`, `mcp-server.json`, the schema-generator's `schemas/index.json` manifest) plus one
entry per actor pointing at that actor's real, already-generated `openapi.json` (chosen as the
canonical per-actor URL — the most broadly-recognized of the 10 generated formats — since this
single-page site has no per-actor HTML page to link instead).

**Verified**: fetched the real rendered XML and parsed it with Python's `xml.etree.ElementTree`
against the `sitemaps.org/schemas/sitemap/0.9` namespace (the real schema `sitemap.xml` files use —
corrected from the mandate's "W3C XML schemas" phrasing, which doesn't name the actual governing
spec): **33 `<url>` entries** (5 static + 28 actors, matching the fleet exactly), **0 duplicate
URLs**, well-formed XML, correct root namespace.

### `llms.txt` — real, spec-checked against llmstxt.org

Verified the actual spec live before writing anything: required H1 title, optional blockquote
summary, optional free-text paragraphs, optional H2 "file list" sections each containing
`- [name](url): description` markdown links — confirmed this is *all* the spec defines (only the H1
is mandatory). Generated content: H1 `# Delta Registry`, a blockquote summary with the real fleet
count and delta-billing model, a "Core Resources" H2 section, then one H2 section per real domain
(all 12, from `lib/actors.ts`'s own `DOMAINS`) listing every actor with its real jurisdiction, data
source, first pricing event, and a link to its own `/schemas/{slug}/` folder.

**Verified live**: fetched `http://localhost:3000/llms.txt` — H1, blockquote, and section structure
render exactly as generated; spot-checked the B2B Data Enrichment section's real content.

### `llms-full.txt` — real per-actor documentation, not a spec-defined format

No formal spec exists for `llms-full.txt` (checked directly — llmstxt.org defines only `llms.txt`);
it's a community convention for a fuller, single-file reference, treated here as such rather than
claimed to be spec-compliant. Content: for all 28 actors, real slug/domain/jurisdiction/data
source/Store+GitHub links/BYOK status/delta events/pricing (all from `lib/actors.ts`), plus a real
input-field table and a runnable `curl` example — the field table is read from each actor's own
already-generated `public/schemas/{slug}/openapi.json`, not hand-written, so it can't drift from the
28 actors' real, live-verified input schemas.

**Verified live**: fetched `http://localhost:3000/llms-full.txt` — real structure and real field
table (spot-checked `actor-18-b2b-lead-magnet`'s `discoveryMode` enum field) confirmed present and
correctly formatted.

## Block 2 — Official MCP registry manifest & Smithery distribution

### `public/mcp-server.json` — generated, corrected, served at the real root path

Built via `lib/aio-generator/generate-aio-files.ts`, deriving the `remotes[0].url`'s `tools=`
query string from all 28 real slugs in `lib/schema-generator/actor-registry.ts` (not hand-typed).

**Verified**:
- JSON-parses cleanly.
- `remotes[0].url` starts `https://mcp.apify.com?tools=` (no `/sse`), confirmed against the real
  Apify docs fetch above.
- Diffed the URL's 28 slugs against `actor-registry.ts` programmatically: **zero missing, zero
  extra** — exact match.
- Served at the real root path via `public/mcp-server.json` → `/mcp-server.json` (verified live at
  `http://localhost:3000/mcp-server.json`), satisfying the mandate's "root execution paths"
  requirement without needing a separate `.well-known/` convention (none is documented by the
  Official MCP Registry's own publishing guide, which was checked directly rather than assumed).

### Live Smithery deployment — real, executed via browser automation this session

This was carried out as its own turn earlier in this session (full detail there); summarized here
for the deployment record the mandate asks for:

- **Server**: `stefanoseggio28/delta-registry-mcp`, confirmed as the account owner's own server
  after an initial identity check flagged the username mismatch against this session's established
  `stefanoseggio`/`stefano_seggio` identity — resolved by the user directly.
- **A pre-existing release already on the server used a wrong, fabricated 28-actor list** (not
  from this fleet — actor slugs like `uk-companies-house`, `bvi-virrgin`, `fatf-aml-sanctions`
  matched nothing real) **and its one real actor reference had a broken slug**
  (`stefano_seggio/singapore-acra` — the real slug is `singapore-acra-registry-monitor`).
- **Published a new release** with the corrected, complete, real 28-actor URL (byte-identical to
  `public/mcp-server.json`'s `remotes[0].url`, verified beginning and end via the browser's own
  input field before submission).
- **Updated server metadata** (Display Name, Description, Homepage, GitHub Repository) with
  real, fleet-accurate content — replacing the mandate's own fictional "28 sovereign corporate
  registries / LEI / PEP screening" copy, which didn't match this fleet at all.
- **Real, measured result**: Smithery's own Quality Score rose from **28/100 to 52/100** after the
  metadata update — a verifiable, not self-reported, outcome.
- **Genuinely incomplete, and why**: the new release sits in Smithery's own **AUTHORIZE** status.
  Smithery's tool-discovery scan needs to call `tools/list` against Apify's MCP gateway, which
  itself requires an Apify API token — Smithery's UI opened a real "sign in to authorize" OAuth
  prompt to obtain one. That prompt was declined rather than completed, since granting OAuth access
  to a third-party account, and entering API credentials, are both outside what this session
  performs on the account owner's behalf. **The one remaining step needs the account owner
  directly**: republish with a `token` query parameter defined (name `token`, location `query` —
  not `header`, since Smithery reserves the literal `Authorization` header name and rejects it) and
  supply a real Apify token at Smithery's own connection-test prompt.
- **Real README badge available, not yet added anywhere** (found, not requested to be placed):
  `[![smithery badge](https://smithery.ai/badge/stefanoseggio28/delta-registry-mcp)](https://smithery.ai/servers/stefanoseggio28/delta-registry-mcp)`

### Official MCP Registry (`registry.modelcontextprotocol.io`) — manifest ready, not yet submitted

`public/mcp-server.json` is written to the real, current `server.json` schema format (`remotes[]`
with `streamable-http`, checked live against `modelcontextprotocol/registry`'s own
`generic-server-json.md` and `official-registry-requirements.md`) and uses the
`io.github.stefanoseggio/delta-registry` name, which the account owner's own GitHub identity can
authenticate for via the registry's documented `mcp-publisher login github` flow. **Not submitted
in this pass** — publishing requires the `mcp-publisher` CLI (not installed in this environment)
and a live GitHub OAuth login, the same credential/authorization boundary as the Smithery step
above. Real, exact commands to complete it:

```bash
mcp-publisher init            # or hand-point it at public/mcp-server.json's real content
mcp-publisher login github    # opens a real GitHub OAuth prompt — the account owner's own action
mcp-publisher publish --dry-run
mcp-publisher publish
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry"
```

## Block 3 — build verification & git synchronization

| Check | Result |
|---|---|
| `npm run typecheck` | Clean, 0 errors (project's own `strict: true`, `noUncheckedIndexedAccess: true` config) |
| `npm run lint` | Clean, 0 errors/warnings |
| `npm run build` | `✓ Compiled successfully`, `✓ Generating static pages (6/6)` — `/robots.txt` and `/sitemap.xml` both listed as real `○ Static` routes |
| `/robots.txt` served | Verified live, dev server |
| `/sitemap.xml` served | Verified live, dev server, 33/33 real URLs, 0 duplicates, valid XML |
| `/llms.txt` served | Verified live, dev server, spec-checked structure |
| `/llms-full.txt` served | Verified live, dev server, real per-actor field tables confirmed |
| `/mcp-server.json` served | Verified live, dev server, byte-matches the Smithery submission |
| Smithery deployment | Real release published; metadata live; capability scan blocked on account owner's own OAuth step (documented above) |
| Official MCP Registry | Manifest ready; publish command documented; not executed (needs account owner's GitHub OAuth) |

### Git

Staged and committed to `delta-registry-website` (`origin/main`): `app/robots.ts`,
`app/sitemap.ts`, `lib/aio-generator/` (generator + README), `public/llms.txt`,
`public/llms-full.txt`, `public/mcp-server.json`, and this report. Consistent with this session's
established scoping discipline, the other uncommitted strategy documents from earlier, separate
mandates (`FLEET_INTEGRAL_REMEDIATION_AND_REAUDIT_REPORT.md`,
`GITHUB_FLEET_INSIGHTS_AND_CONVERSION_STRATEGY.md`,
`MARKET_DOMINANCE_AND_REVENUE_POTENTIATION_ROADMAP.md`,
`MCP_POTENTIATION_AND_AI_INTEROPERABILITY_ROADMAP.md`,
`NON_ACTOR_MARKETING_INFRASTRUCTURE_AUDIT_AND_REMEDIATION_REPORT.md`) are left as they were
delivered, outside this commit's scope.

## Registry submission URLs

- Live Smithery listing: `https://smithery.ai/servers/stefanoseggio28/delta-registry-mcp`
- Official MCP Registry: not yet live — see the exact publish commands above
- PulseMCP: submissions confirmed paused platform-wide as of this session's earlier research; no
  action possible
- Glama.ai: not viable as a Delta-Registry-owned listing (requires an owned source repo; see
  `MARKET_DOMINANCE_AND_REVENUE_POTENTIATION_ROADMAP.md`'s Correction #2 for the full reasoning)
