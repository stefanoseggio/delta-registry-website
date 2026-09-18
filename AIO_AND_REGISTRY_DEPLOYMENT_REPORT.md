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

---

## Official Registry Audit — appended 2026-09-18

A follow-up sprint specifically to prepare `public/mcp-server.json` for submission to
`registry.modelcontextprotocol.io`. One of this sprint's own starting assumptions didn't survive
contact with the real schema, and the process caught one genuine, previously-unnoticed defect in
the manifest — both are documented below rather than smoothed over, consistent with this session's
standing practice.

### Correction made before auditing anything

The sprint's own brief asked to verify "the required query parameter configuration
(`?token={token}`)" against the live Apify gateway spec. **This isn't accurate, and building the
audit around it would have meant fixing something that isn't broken while missing what actually
was.** `?token=` was Smithery's own UI workaround, adopted in that platform's own connection-
parameter flow specifically because Smithery's UI rejects `Authorization` as a custom header name
("Header 'Authorization' is reserved" — confirmed directly, in that same session, from Smithery's
own validation error). That is a Smithery-specific implementation constraint, not a rule of the
underlying MCP `server.json` format. Checked directly against the real, current
`server.schema.json` (fetched live from `static.modelcontextprotocol.io`, draft-07): the schema's
`StreamableHttpTransport` definition supports an optional `headers` array (of `KeyValueInput`
objects: `name` required, `description`/`isRequired`/`isSecret`/`default`/etc. all optional) with
**no restriction on header names whatsoever** — no mention of "Authorization," "reserved," or
"forbidden" anywhere in the 574-line schema. `public/mcp-server.json`'s existing
`headers: [{name: "Authorization", ...}]` declaration is fully schema-valid and is the more
conventional, broadly-client-compatible mechanism (Claude Desktop's `mcp-remote` bridge, Cursor,
and Windsurf were all independently confirmed earlier this session to support per-server custom
headers in their MCP client configs) — it was kept as-is rather than "corrected" to match a
constraint that only applies to a different platform's UI.

### Block 1 — Manifest compliance & schema audit

Fetched the real, current schema directly: `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`
(HTTP 200, draft-07, `$id` matches the `$schema` value already used in `public/mcp-server.json`).
Validated with Python's `jsonschema` library (`Draft7Validator`, not a hand-rolled check) against
the real, live file.

**First pass found a real, genuine defect**: the top-level `description` field failed schema
validation — `"...213 characters..." is too long`. The schema caps `description` (and separately
`title`) at `maxLength: 100`, with explicit guidance to "focus on capabilities, not implementation
details." The original text (`"28 pay-per-event regulatory, sanctions, procurement, and
corporate-registry monitoring tools exposed via Apify's hosted MCP gateway. Delta-classified
output so a repeat call never re-bills for an unchanged record."`) was 213 characters and named
implementation details ("Apify's hosted MCP gateway") the schema's own guidance says to avoid.

**Fixed in the generator source**, not just the output file — `lib/aio-generator/generate-aio-files.ts`'s
`buildMcpServerJson()` now computes `description` as a capability-focused, 97-character string
(`"28 pay-per-event tools for regulatory, sanctions, procurement, and corporate-registry
monitoring."`) and asserts both `title` and `description` are ≤100 chars at generation time,
throwing a build-time error rather than silently emitting an invalid file if either regresses past
the limit in a future edit. Regenerated all 3 files from the fixed source; `npm run typecheck`,
`npm run lint`, and `npm run build` all re-confirmed clean afterward.

**Re-validated after the fix**: `Draft7Validator` — **0 errors**, fully schema-valid.

URI/pattern checks: `remotes[0].url` matches the schema's required `^https?://[^\s]+$` pattern;
`name` (`io.github.stefanoseggio/delta-registry`, 38 chars) is well under the 200-char cap and
correctly contains exactly one `/` separating namespace from server name, matching the schema's
own stated requirement.

### Block 2 — Triple-pass adversarial verification

**Pass 1 (Structural Validation)** — covered above: real Draft-07 validation via `jsonschema`,
0 errors after the fix. Additionally ran the *official* tool's own validator (see Submission
Protocol below) as a second, independent structural check.

**Pass 2 (Protocol & Security Audit)** — grepped `public/mcp-server.json` and
`lib/aio-generator/generate-aio-files.ts` for anything token/credential-shaped
(`apify_api_...`, `Bearer <real-looking string>`, a hardcoded `token=`/`key=` value): zero matches
in either file. Separately confirmed programmatically that the one `isSecret: true`-marked header
(`Authorization`) carries no literal `value` property alongside it — per the schema's own
semantics, a `value` present on an input means "not configurable by end users," so its absence is
what makes this a real, safe secret declaration rather than an accidental leak. No credential of
any kind is embedded in the manifest.

**Pass 3 (Edge-Case & Drift Analysis)** — re-diffed the manifest's 28 `tools=` slugs against
`lib/schema-generator/actor-registry.ts` programmatically: 0 missing, 0 extra, 0 duplicates.
Re-confirmed the transport is `streamable-http` with no `/sse` substring anywhere in the URL
(SSE retired by Apify 2026-04-01, already covered in this report's main body). Re-confirmed live
that the deployed dev-server endpoint (`http://localhost:3000/mcp-server.json`) serves the exact,
regenerated, now-valid content.

### Block 3 — Submission protocol & post-registration verification artifacts

**The real official CLI, not the deceptively-named npm package.** `npm search mcp-publisher`
returns a same-named but entirely unrelated package (a Russian-language "browser automation for
auto-publishing content" tool built on Playwright, v0.4.2, published by an unrelated maintainer) —
installing it would have meant running an unverified third-party automation tool under a
misleading name. The real, official CLI is distributed only as a signed GitHub Release binary from
`modelcontextprotocol/registry` (v1.8.1). Downloaded `mcp-publisher_windows_amd64.tar.gz` via the
authenticated `gh` CLI and verified its SHA-256 against the release's own published checksums file
before extracting or executing it:

```
399ad0d6e00a50812b563a71d8bfbff5160c085e6b13aac6ec083d98d5ff7c45  mcp-publisher_windows_amd64.tar.gz
```
— computed hash matched exactly.

**Ran the official tool's own `validate` command** (no authentication required) against the real,
regenerated `public/mcp-server.json`, live against the production registry endpoint:

```
$ mcp-publisher validate ./server.json
Validating against https://registry.modelcontextprotocol.io...
✅ server.json is valid
```

This is a stronger confirmation than the local `jsonschema` pass alone — it's the actual tool the
registry uses, checked against the live service, not a local approximation of the schema.

**Confirmed exactly where the real credential boundary is**, rather than guessing: `mcp-publisher
publish` was run once without logging in, and failed exactly as documented —
`Error: not authenticated, run 'mcp-publisher login <method>' first` (exit 1). `login --help`
confirms the `github` method opens **interactive GitHub authentication** — a real OAuth consent
flow tied to the account owner's own GitHub identity. Since the manifest's `name` field
(`io.github.stefanoseggio/delta-registry`) is namespaced under the `stefanoseggio` GitHub account
specifically, `github` is the correct (and only applicable) login method here — the CLI's
alternative `dns`/`http` methods authenticate a domain-namespaced name (`com.example/...`), not
a GitHub one. This is the same class of action declined earlier this session for Smithery, for the
same reason: granting OAuth access to a third-party tool is the account owner's decision, not
something completed on their behalf.

**SHA-256 checksum of the final, submitted-ready manifest** (for exact version tracking — this is
the file that passed both validation passes above):

```
45ada70e42204d4cae353956d9410ae51c6a46a051ed7f563e6c8a5bc3acc3c4  public/mcp-server.json
```
(3,323 bytes, as committed)

**Exact remaining steps, for the account owner to run directly:**

```bash
# 1. Get the real, official CLI (NOT `npm install mcp-publisher` — that installs an unrelated package)
gh release download v1.8.1 --repo modelcontextprotocol/registry --pattern "mcp-publisher_windows_amd64.tar.gz"
gh release download v1.8.1 --repo modelcontextprotocol/registry --pattern "registry_1.8.1_checksums.txt"
sha256sum -c <(grep mcp-publisher_windows_amd64.tar.gz registry_1.8.1_checksums.txt)  # confirm the hash above
tar -xzf mcp-publisher_windows_amd64.tar.gz

# 2. Authenticate as stefanoseggio (opens a real GitHub OAuth prompt in your browser)
./mcp-publisher.exe login github

# 3. Re-validate (optional — already confirmed valid in this audit) and publish
./mcp-publisher.exe validate ./public/mcp-server.json
./mcp-publisher.exe publish ./public/mcp-server.json

# 4. Verify the live listing
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry"
```

### Final status

`public/mcp-server.json` is schema-valid (both by independent `jsonschema` validation and the
official tool's own live validator), contains zero embedded credentials, has zero drift against
the real 28-actor fleet, and is one `login github` + `publish` command away from a live Official
Registry listing — a real, verified, precisely-bounded gap, not an open-ended one.

---

## Glama & PulseMCP Multi-Registry Expansion Audit — appended 2026-09-18

A follow-up sprint scoped to Glama and PulseMCP specifically. Both blocks' own briefs assumed an
active ingestion pipeline exists on each platform that a manifest could be adapted for. Neither
assumption survived a fresh, live check — re-verified rather than carried over from earlier in
this session, since both facts are exactly the kind that can change and are cheap to re-check. One
number in the brief ("32-tool capability payload = 28 fleet actors + 4 utility functions") **did**
check out, verified for the first time here against the live Smithery tool list rather than left
as an unconfirmed inference.

### Verified first: the real 32-tool breakdown

Expanded the full tool list on the live Smithery listing (`stefanoseggio28/delta-registry-mcp`,
"Show 22 more…") rather than trust the earlier session's own hypothesis. **Confirmed exactly**:
28 actor-specific tools (one per fleet actor, name-matched against all 28 real slugs) plus exactly
4 generic, Apify-gateway-provided utility tools, each with a real, distinct capability — **Get
Actor run** (read-only; run status, `summary`/`nextStep` fields), **Get dataset items** (read-only;
dataset rows, `clean=true` option), **Get key-value store record** (read-only; single-record
fetch), **Abort Actor run** (destructive, idempotent; stops a running/starting run). 28 + 4 = 32,
exactly matching the live Overview page's own `Tools: 32` count. This breakdown is now a verified
fact, not an inference — worth keeping precise, since "32 tools" without the real breakdown reads
as unexplained inflation to anyone auditing the number.

### Block 1 — Glama: re-confirmed not viable, with a new, concrete reason why

Re-checked live (not assumed from the earlier session pass) whether Glama has added any
remote-URL or `server.json`-based ingestion path since that check: it has not. Glama's own
"Add Server" flow still requires an owned GitHub repository containing the MCP server's actual
source plus a `glama.json` manifest committed to that repo. Glama's separate **Hosting** product
(install the Glama GitHub App, connect a repo, Glama builds and deploys the server) is a different
offering entirely — it makes Glama the *runtime*, not a way to register an externally-hosted
endpoint like `mcp.apify.com`. Neither path accepts `public/mcp-server.json` (the Official
Registry's format) as an input at all; there is no field-mapping or adaptation script that closes
this gap, because the gap isn't a schema mismatch — it's a structural requirement (owned source
code in an owned repo) that no script run inside `delta-registry-website` can satisfy.

**A new, concrete finding this pass adds**: checked whether Delta Registry's actors are
*already* discoverable on Glama some other way, rather than assuming the only path is a fresh
submission. They are not — but Apify's own generic MCP server is: `glama.ai/mcp/servers/@apify/actors-mcp-server`
is a real, live, **"Official"-badged** listing, showing the gateway's own **10 generic tools**
(`search-actors`, `fetch-actor-details`, `call-actor`, `get-actor-run`, `get-dataset-items`,
`get-key-value-store-record`, `abort-actor-run`, `search-apify-docs`, `fetch-apify-docs`,
`report-problem`) — not Delta Registry's 28 actor-specific ones, which only exist behind a
customer-specific `?tools=` query scope Glama's crawler has no way to see or attribute. A user
searching Glama for e.g. "maritime sanctions monitor" will not find this fleet there, and no
action available to Delta Registry today changes that — the listing that *does* exist is
correctly attributed to Apify, since Apify genuinely operates that generic server.

**What "formulate programmatic adaptation scripts" honestly resolves to**: nothing to build. A
script is the right tool when a real endpoint exists and the blocker is a format/field mismatch.
Here there is no endpoint to adapt toward. The only two real paths, both already evaluated and
both correctly not taken, are: (a) fork `apify/apify-mcp-server` into an owned repo and list the
fork — rejected in `MARKET_DOMINANCE_AND_REVENUE_POTENTIATION_ROADMAP.md`'s Correction #2, since it
would misrepresent who wrote and operates the code, and would need indefinite upstream-sync
maintenance for no functional gain; or (b) wait for Apify itself to add customer-attributed,
per-scope listings to its own official Glama entry — entirely outside Delta Registry's control, not
something to plan around as if it were scheduled.

### Block 2 — PulseMCP: re-confirmed paused, with the exact live status text

Fetched `pulsemcp.com/submit` live (not carried over from the earlier session pass): still not
accepting submissions. Exact, current, quoted status: **"We are not accepting new MCP server or
client submissions right now, and we are not making changes to existing listings."** The page
itself now directs prospective submitters to the Official MCP Registry instead — reinforcing that
completing the Official Registry submission (Block 3 of the prior append to this report, currently
blocked only on the account owner's own `mcp-publisher login github`) is the highest-leverage
single action available across every registry covered in this document, PulseMCP included, since
PulseMCP's own docs describe partial auto-ingestion from that registry once its submissions
reopen.

**Same discoverability check run against PulseMCP as against Glama, same result**: Apify's generic
server is already listed twice independently (`pulsemcp.com/servers/apify` — "Official Apify MCP
Server" — and `pulsemcp.com/servers/apify-actor` — "Official Apify Actor MCP Server"), both
describing the generic, dynamic-tool-discovery gateway, neither attributing or exposing Delta
Registry's specific 28-actor, pay-per-event scope.

**"Validate endpoint availability, Streamable HTTP transport compliance, and header-based security
declarations"** — these are real, checkable properties, and they were already verified in this
report's main body and its Official Registry append (live `/mcp-server.json` fetch, `streamable-http`
transport confirmed correct and current per Apify's own docs, `Authorization` header declaration
confirmed schema-valid with zero restriction at the protocol level). Nothing new to validate here
specific to PulseMCP — its submission form is disabled while paused, so there is no PulseMCP-side
schema to validate the payload against beyond what the Official Registry's schema (which PulseMCP
partially re-ingests from) already covers.

**Real, ready-to-submit content prepared now**, reusing the same verified metadata already used for
Smithery and the Official Registry (a single, consistent source of truth across every channel,
rather than independently-drifting copy per platform) — this is genuinely new prep work, not merely
restating the blocked status, so that resubmission is a copy-paste action the moment PulseMCP
reopens, not a fresh drafting exercise:

| Field | Value |
|---|---|
| Server name | Delta Registry |
| One-line description | 28 pay-per-event tools for regulatory, sanctions, procurement, and corporate-registry monitoring. |
| Tool count | 32 (28 actor-specific + 4 generic Apify-gateway utility tools — see breakdown above) |
| Transport | Streamable HTTP |
| Endpoint | `https://mcp.apify.com?tools=stefano_seggio/actor-18-b2b-lead-magnet,...` (full URL: `public/mcp-server.json`'s `remotes[0].url`) |
| Homepage | `https://delta-registry-website.vercel.app` |
| GitHub repo | `https://github.com/stefanoseggio/delta-registry-website` |
| Categories | Regulatory Compliance, Sanctions Screening, Government Procurement, Corporate Registries, Patent & IP, Pharma Safety, Securities Enforcement |

### Block 3 — Multi-registry automation & adversarial audit

**Pass 1 (credential-leak sweep, expanded scope)**: grepped every manifest/generator file touched
across this entire multi-registry effort — `public/mcp-server.json`, `public/llms.txt`,
`public/llms-full.txt`, `lib/aio-generator/`, `lib/schema-generator/` — for token/credential-shaped
strings (`apify_api_...`, a real-looking `Bearer <token>`, a hardcoded `token=`/`key=` value with
15+ alphanumeric characters). **Zero matches across all files.**

**Pass 2 (slug-drift, three-way cross-check)**: the mandate specifically named `lib/actors.ts` as
the drift-check target — previous passes in this report checked `lib/schema-generator/actor-registry.ts`
against the manifest but not `lib/actors.ts` directly. Ran all three against each other
programmatically: `lib/actors.ts` (28 slugs), `lib/schema-generator/actor-registry.ts` (28 slugs),
`public/mcp-server.json`'s `remotes[0].url` (28 slugs) — **all three sets are byte-identical, zero
drift in any direction.** This matters specifically because these three files are maintained by
different mechanisms (`lib/actors.ts` is hand-maintained fleet data; `actor-registry.ts` and
`mcp-server.json` are generator-derived) — a real drift between them would have been the kind of
silent divergence this session has repeatedly caught and fixed elsewhere.

**Pass 3 (definitive execution instructions, per-registry, honestly scoped to what's real today)**:

| Registry | Status | Action available today |
|---|---|---|
| Official MCP Registry | Manifest valid (0 schema errors, official CLI's own `validate` passed live) | `mcp-publisher login github` then `mcp-publisher publish ./public/mcp-server.json` — exact commands and checksum verification in this report's prior section. Account owner's own OAuth required; not completed on their behalf. |
| Smithery | **Live, SUCCESS**, 32/32 tools indexed, Quality Score 73/100 | None needed — already complete, verified live earlier this session. |
| Glama | Not viable — no ingestion path exists for a remote, non-owned server | None available. Monitor only if Apify itself changes its own listing's scope in the future — not a Delta-Registry-side action. |
| PulseMCP | Paused platform-wide, confirmed live this pass | None available now. Ready-to-submit content is prepared above; check `pulsemcp.com/submit` when convenient, or wait for the Official Registry entry to auto-propagate per PulseMCP's own stated ingestion design. |

### Final status

No code, manifest, or generator changes were made in this pass — the real finding across all three
blocks is that `public/mcp-server.json` (already schema-valid, already credential-clean, already
drift-free per this pass's own three-way cross-check) is the correct, sufficient artifact for
every registry that can currently accept a submission, and the two that can't (Glama, PulseMCP)
are blocked by real, external, platform-level constraints — not by anything fixable in this
repository. Nothing here was left vague to appear more actionable than it is.

---

## Official Registry — Live Publish Attempt, Execution Log — appended 2026-09-18

An automated pre-flight-through-auth-gate deployment sequence, driven directly (each step depends
on the live output of the previous one — not a task that benefits from parallel/multi-agent
execution). Every timestamp, command, and output below is real, not reconstructed after the fact.

### Pre-flight

1. **Manifest integrity**: `sha256sum public/mcp-server.json` → `45ada70e42204d4cae353956d9410ae51c6a46a051ed7f563e6c8a5bc3acc3c4`
   — byte-identical to the checksum recorded in this report's prior Official Registry Audit section.
   Unchanged since its last full validation pass.
2. **Git state**: working tree clean relative to this file; `git fetch origin` showed no unpulled
   commits.
3. **CLI binary re-verification**: the previously downloaded, checksum-verified `mcp-publisher.exe`
   (v1.8.1) was re-confirmed present and its source archive's SHA-256 re-checked against the
   official release checksums file — matched again, not just assumed still valid from an earlier
   pass.
4. **Live schema validation — a real, transient failure caught and correctly diagnosed, not
   misreported**: the first `mcp-publisher validate` attempt failed with a TLS handshake timeout; a
   second attempt failed with a connection timeout to the resolved IP. Rather than either retrying
   blindly or reporting "the manifest is broken" (it wasn't — the checksum above proves nothing
   changed), isolated the cause directly: `curl` to `static.modelcontextprotocol.io` (200, 0.35s)
   and `api.github.com` (200, 0.16s) both succeeded instantly, while `registry.modelcontextprotocol.io`
   specifically hung to a 15s timeout — a transient issue with that one service, not this
   environment's network or the manifest. A follow-up direct `curl -v` to the registry's own
   `/v0.1/servers` endpoint succeeded cleanly (`HTTP/1.1 200 OK`) moments later, and — a real,
   useful side-effect of this diagnostic — confirmed live that `io.github.stefanoseggio/delta-registry`
   is not yet published (`{"servers":[],"metadata":{"count":0}}`), exactly as expected before this
   sequence's own publish step runs. Re-ran `mcp-publisher validate` a third time: **`✅ server.json
   is valid`**, exit 0.

### Authentication — the real human-in-the-loop boundary, reached and correctly stopped at

Checked `mcp-publisher login github --help` before invoking it: the command accepts an optional
`-token` flag for a GitHub Personal Access Token as a non-interactive alternative. **Not used** —
supplying any credential value, from any source, on the account owner's behalf is outside what this
session does regardless of the mechanism.

Ran `mcp-publisher login github` with no token, in the background (it blocks polling for the OAuth
callback, so a bounded foreground call would have just hung this turn). Its real, live output:

```
Logging in with github...

To authenticate, please:
1. Go to: https://github.com/login/device
2. Enter code: E221-5472
3. Authorize this application
Waiting for authorization...
```

This is the standard GitHub **Device Authorization Flow** (the same UX as `gh auth login`) — not a
redirect-based browser popup, so there is nothing for a browser-automation tool to click through
even in principle; the code must be entered by a signed-in human. **Verified the process is
genuinely still alive and polling**, not silently killed when the wrapper script that launched it
returned — `tasklist` confirms `mcp-publisher.exe` (PID 2928) is running, and `ps` confirms the
underlying process (PID 444) is active. This matters operationally: the device code above stays
valid and the login completes automatically, in the background, the moment the human step below is
done — no further command needs to be re-run to pick it up.

### Exact next step — for the account owner, `stefanoseggio`, to complete directly

1. Go to **`https://github.com/login/device`**
2. Enter code: **`E221-5472`**
3. Confirm you're authorizing as the `stefanoseggio` account, and click **Authorize**

The device code is single-use and time-limited (GitHub's standard device-flow expiry, typically on
the order of 15 minutes) — if it has expired by the time this is read, say so and a fresh
`mcp-publisher login github` will issue a new one; nothing about the pre-flight validation above
needs to be re-run, since the manifest itself is unchanged and already confirmed valid.

### State on resume

The moment authorization completes, the already-running login process will save credentials to
`~/.config/mcp-publisher/` and exit on its own. The very next command in this sequence — not yet
run, correctly gated here — is:

```bash
./mcp-publisher.exe publish ./public/mcp-server.json
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry"
```

Ready to run both, and document the real result (success or any real error the registry returns),
as soon as authorization is confirmed complete.

---

## Official Registry — LIVE, PUBLISHED — final status, appended 2026-09-18T17:10:18Z

**Delta Registry is now a real, live entry on the Official MCP Registry.** Every claim below was
independently verified against the registry's own API after publishing — not accepted from the
CLI's own success message alone, and one genuine-looking anomaly encountered along the way was
investigated to a confirmed, correct conclusion rather than either dismissed or left unresolved.

### Authentication — independently confirmed before publishing, not just accepted

Before running `publish`, re-checked the claim that authorization had completed, directly against
process and filesystem state rather than the claim's own text: the backgrounded
`mcp-publisher.exe` login process (PID 2928 / shell PID 444, both recorded in this report's prior
entry) **had exited on its own** — `tasklist` returned no match. Its output log had grown two new,
real lines since the last check: `Successfully authenticated!` and `✓ Successfully logged in`. A
genuine, newly-created `~/.config/mcp-publisher/token.json` (487 bytes, timestamped 14:08) confirmed
persisted credentials — its *existence, size, and timestamp* were checked, never its contents.

### Pre-publish final check

Re-verified `public/mcp-server.json`'s checksum one more time immediately before publishing —
`45ada70e42204d4cae353956d9410ae51c6a46a051ed7f563e6c8a5bc3acc3c4`, unchanged since every prior
check in this report — and re-ran live validation: `✅ server.json is valid`.

### Publish — real command, real output

```
$ mcp-publisher publish ./server.json
Publishing to https://registry.modelcontextprotocol.io...
✓ Successfully published
✓ Server io.github.stefanoseggio/delta-registry version 1.0.0
```

### Independent verification against the registry's own live API — not just the CLI's word

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry"
```

Real, live response (relevant fields): `"count": 1"`, the full 28-actor `remotes[0].url` returned
byte-for-byte identical to the submitted manifest, and a registry-managed `_meta` block confirming:

| Field | Value |
|---|---|
| `status` | `active` |
| `isLatest` | `true` |
| `publishedAt` | `2026-09-18T17:09:45.566324Z` |
| `updatedAt` | `2026-09-18T17:09:45.566324Z` |

### A real anomaly investigated, not glossed over

The API response's `title` and the `Authorization` header's `description` initially appeared
mangled when piped through this environment's console (`curl | python -m json.tool` in a Windows
cp1252 terminal rendered the em-dash as `â€”`) — exactly the visual signature of a
real double-encoding bug, and worth checking rather than assuming benign. Re-fetched the response to
a file and decoded it directly in Python, bypassing the console entirely: `title ==
'Delta Registry — Regulatory & Compliance Monitoring (28 tools)'` evaluated **`True`**, and the raw
UTF-8 bytes for the em-dash (`\xe2\x80\x94`) were confirmed present and correct. **The registry's
stored copy is byte-correct; the garbling was purely a local terminal-rendering artifact**, not a
defect in what was published. Recorded here specifically so a future reader doesn't need to
re-diagnose the same false alarm.

### Live, canonical registry identifiers

- **Registry name**: `io.github.stefanoseggio/delta-registry`
- **Version**: `1.0.0`
- **Query the live entry**: `https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry`
- **Status**: `active`, published `2026-09-18T17:09:45Z`

### Cross-registry status, final

| Registry | Status |
|---|---|
| Official MCP Registry | **Live**, `active`, verified independently against the registry's own API |
| Smithery | **Live**, `SUCCESS`, 32/32 tools indexed, Quality Score 73/100 |
| Glama | Not viable — no ingestion path exists for Delta Registry's specific scope (structural platform constraint, not fixable here) |
| PulseMCP | Submissions paused platform-wide; real, ready-to-submit content prepared for when it reopens |

Every real MCP-focused distribution channel currently capable of accepting a submission from Delta
Registry now has one, independently verified live rather than assumed from a success message.
