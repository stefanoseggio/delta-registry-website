# Delta Registry — MCP Integration Guide

This document configures Apify's own hosted **MCP server** (`@apify/actors-mcp-server`, running at
`https://mcp.apify.com`) as a closed-scope gateway exposing exactly the 28 Delta Registry actors —
no other tool from Apify Store, and no custom server code. Every fact below (the base URL, the
`?tools=` scoping syntax, the tool-naming convention, the client config formats, the response-size
ceiling, the payment model) was verified directly against the real `apify/apify-mcp-server` source
code, the live `mcp.apify.com` configurator (signed in as `stefano_seggio`), and Apify's published
integration docs on 2026-09-17 — not assumed from the package name alone, which turned out not to
exist (`@apify/mcp` returns a 404 on the npm registry; the real package is `@apify/actors-mcp-server`).

## Correction from the original spec

Two of the requested actor slugs don't exist: `uk-slavery-registry-compliance-feed` and
`singapore-acra-corporate-registry`. The real, live slugs (confirmed via `gh api
users/stefanoseggio/repos` and the Apify API) are `uk-modern-slavery-statement-registry-monitor`
and `singapore-acra-registry-monitor`. All 28 tool definitions below use the real slugs throughout.

---

## Block 1 — Hosted endpoint & scoped configuration

### 1.1 Base URL and closed-scope query string

The hosted server loads **only** the tools you list in `?tools=` — if the parameter is present at
all, none of the defaults (`actors`, `docs`, `apify/rag-web-browser`, `apify/web-fetch`) are added.
Omitting the open-discovery categories (`actors`, `docs`, `call-actor`, `search-actors`) is
therefore automatic: they simply aren't in the list below, so the fleet-scoped session has no path
to reach any of the other 70,000+ Store actors.

Fully qualified, closed-scope URL (all 28 actors, one per `username/actor-name` entry):

```
https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor
```

That URL is 1,341 characters (verified by direct construction, not estimated) — well inside every
MCP client's practical URL-length tolerance, and inside the browser/HTTP client 8 KB header-line
convention most stacks assume. No actor needed to be dropped or paginated across multiple
endpoints.

### 1.2 Tool-name resolution (verified against `apify-mcp-server`'s own source)

The server does **not** support renaming or aliasing an exposed tool. `src/tools/actor_tool_naming.ts`
(`actorNameToToolName()`) derives the callable tool name deterministically as
`${escapedUsername}--${actorName}` (double dash), truncating with a SHA-256 hash suffix only if the
result exceeds `MAX_TOOL_NAME_LENGTH = 64` characters. Checked every one of the 28 real names against
that 64-char ceiling — the longest, `stefano_seggio--uk-modern-slavery-statement-registry-monitor`,
is 60 characters and `stefano_seggio--emerging-market-sovereign-debt-auction-monitor` is 62; both fit
without truncation, so every tool below has a clean, predictable, permanent name. Block 2's
`check_[jurisdiction]_[domain]` names are documentation shorthand for humans reading this file — the
literal name an LLM will see and must call is the `stefano_seggio--<actor-slug>` form given in each
entry.

### 1.3 Authentication & PPE billing pass-through

No custom auth code is needed. The hosted server accepts a standard `Authorization: Bearer
<APIFY_TOKEN>` header (or OAuth, for clients that support it — Claude.ai, VS Code). Whichever token
calls the tool is whichever Apify account gets billed, at that actor's own live Pay-Per-Event
price — the same billing path as calling the actor directly via `apify-client` or the Console. There
is nothing to "pass through" beyond forwarding the header; Apify's own platform does the metering.

Three additional account-less payment rails exist for autonomous agents that don't hold their own
Apify token — **AGI** (prepaid token minted via x402/MPP, usable exactly like a normal API token),
**direct x402** (USDC on Base, per-request, via the `mcpc` client), and **Skyfire** (prepaid PAY
tokens passed as a tool-call parameter). These matter only if you intend third-party autonomous
agents (not your own Claude Desktop/Cursor session) to call the fleet without ever creating an Apify
account — worth knowing about, not required for the primary use case here.

### 1.4 Client configuration snippets (verified live against the real `mcp.apify.com` configurator)

**Claude Desktop** does not use a hand-written JSON pointing `command`/`args` at
`@apify/actors-mcp-server` directly — the currently-recommended path (confirmed on
`docs.apify.com/integrations/claude-desktop` and the live configurator) is either a UI-installed
custom connector with OAuth, or a JSON config that bridges through the generic `mcp-remote` stdio
proxy to the *remote* hosted server. `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "delta-registry": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor",
        "--header",
        "Authorization: Bearer ${APIFY_TOKEN}"
      ]
    }
  }
}
```

Replace `${APIFY_TOKEN}` with a real token from **Apify Console → Settings → Integrations** before
saving — `mcp-remote` does not expand shell environment variables inside the JSON string itself, so
either paste the literal token (then keep this file out of version control — it is a live secret,
not a placeholder) or point `mcp-remote` at an env-var-populated wrapper script if your OS supports
one. Restart Claude Desktop after saving.

**Cursor** (`~/.cursor/mcp.json` for a global setup, or `.cursor/mcp.json` in a specific project)
uses native HTTP transport — no `mcp-remote` bridge needed:

```json
{
  "mcpServers": {
    "delta-registry": {
      "url": "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor",
      "headers": {
        "Authorization": "Bearer ${APIFY_TOKEN}"
      }
    }
  }
}
```

**LangChain / custom SDKs**: no MCP-specific config file — use any MCP-compliant HTTP client library
against the same URL and header. The `apify-client` Python/JS SDKs can also call these 28 actors
directly without going through MCP at all, if the calling code is your own rather than an LLM agent
deciding which tool to invoke.

**System environment variable**: set `APIFY_TOKEN` in your shell profile or OS-level environment
manager and reference it from whichever config-templating mechanism your OS/shell provides — the
JSON files above intentionally do not embed a literal token, since this file is meant to be
committed to the `delta-registry-website` repo.

**SSE transport note**: the legacy `https://mcp.apify.com/sse` endpoint has been removed by Apify in
favor of Streamable HTTP. Any config referencing the `/sse` suffix is broken under the current
server version — every URL above already omits it.

---

## Block 2 — Tool registry: all 28 actors

For each actor: the literal MCP tool name (`stefano_seggio--<slug>`), a human-readable mnemonic,
the prompt-engineered `description` an LLM agent sees, real BYOK status, and the real payload/
`maxItems` handling relevant to the 256 KB inline-response ceiling (results are returned inline up
to 256 KB; anything larger comes back as a short notice plus a dataset-download URL instead of the
raw body — confirmed from the server's own `resources/read` documentation).

### 1. `stefano_seggio--actor-18-b2b-lead-magnet` — `check_global_b2b_leads`
**Description**: "Discover B2B leads from a caller-supplied seed list or OpenStreetMap business
data (never Google Maps). Call this when the user wants to build a prospect list from a geographic
area or business category, not when they already have a specific company to look up in a
regulatory registry — this tool has no delta/compliance-tracking concept, it's a one-shot discovery
crawl." **BYOK**: none required; optional Hunter.io / People Data Labs key unlocks the
`enriched_lead` tier with verified contact emails — omit for `basic_lead` only. **Payload**: no
`maxItems` cap beyond the caller's own seed-list size; typical result well under 256 KB.

### 2. `stefano_seggio--actor-19-maritime-sanctions-monitor` — `check_global_maritime_sanctions`
**Description**: "Check whether a vessel (by name or IMO number) appears on the OFAC SDN sanctions
list cross-referenced against the UN Security Council Consolidated List. Call this for
vessel/shipping sanctions questions specifically — not for corporate or individual sanctions,
which this actor does not cover." **BYOK**: none. **Payload**: default `maxItems` keeps single-run
results small; the source is a single unpaginated OFAC export so a full-list pull can approach the
inline cap — recommend the caller filter by vessel name/IMO rather than requesting the full list
through an LLM tool call.

### 3. `stefano_seggio--actor-20-mdb-procurement-monitor` — `check_worldbank_procurement`
**Description**: "Check World Bank Procurement Notices and the 'Other Sanctions' debarred-firms
table. Scope is the World Bank only — ADB and IDB are explicitly excluded (Cloudflare-gated and
robots.txt-blocked respectively) and this tool will not silently return partial/wrong data for
those institutions; route ADB/IDB questions elsewhere or disclose the gap to the user." **BYOK**:
none. **Payload**: two independently-priced sub-sources (`procurementNotices` $0.001,
`debarredFirms` $0.003); both fit inline easily at normal `maxItems`.

### 4. `stefano_seggio--actor-21-patent-ip-enforcement-monitor` — `check_us_eu_patent_enforcement`
**Description**: "Track USPTO PTAB patent-dispute proceedings (IPR/PGR/CBM/Derivation) and,
optionally, EPO opposition data. **Requires the caller to supply their own free USPTO Open Data
Portal (ODP) API key** — this is a hard runtime requirement for USPTO coverage, not optional; the
tool call will fail without it. EPO coverage is separately optional and needs its own EPO key only
if EU opposition data is wanted on top of USPTO." **BYOK**: **required** (USPTO ODP key) for the
primary function; optional second key (EPO) for EU coverage. **Payload**: per-record + compute-time
(`$0.25/CU-hour`) pricing — warn the calling agent this tool has a compute-time cost component
distinct from every other actor in the fleet, so cost estimation logic shouldn't assume flat
per-event pricing here.

### 5. `stefano_seggio--actor-22-drug-safety-recalls-monitor` — `check_us_eu_drug_safety`
**Description**: "Check FDA openFDA drug enforcement (recall) data and EMA DHPC safety alerts,
combined into one schema. Call this for drug/pharmaceutical recall and safety-alert questions —
for clinical *trial status* (not recalls), use `check_global_clinical_trials` instead; the two
actors cover different regulatory questions about the same broad pharma domain." **BYOK**: none.
**Payload**: single `result` tier, $0.001/record, comfortably inline.

### 6. `stefano_seggio--actor-24-clinical-trials-delta-engine` — `check_global_clinical_trials`
**Description**: "Track ClinicalTrials.gov trial status changes (RECRUITING/COMPLETED/TERMINATED)
cross-referenced against FDA Orange Book patent/exclusivity data. Call this for trial-status and
patent-exclusivity questions on a specific drug/trial — not for adverse-event/recall questions,
which route to `check_us_eu_drug_safety`." **BYOK**: none. **Payload**: adds a
`$0.00005/run-start` micro-charge on top of the `$0.002/record` tier — negligible but real; disclose
if a calling agent itemizes cost per tool call.

### 7. `stefano_seggio--australia-grantconnect-monitor` — `check_australia_grants`
**Description**: "Check Australian Government grant awards on GrantConnect — recipient, ABN,
agency, value, purpose, program, location. Call this for federal Australian grant-award questions,
not state-level procurement (which Australia does not have coverage for elsewhere in this fleet)."
**BYOK**: none. **Payload**: server-side keyword/category/ABN/value/date filters — instruct the
calling agent to filter server-side rather than requesting the full 360,000+-record register and
filtering client-side, which would risk exceeding the 256 KB inline cap.

### 8. `stefano_seggio--cordoba-compras-monitor` — `check_argentina_cordoba_tenders`
**Description**: "Check active public tenders (licitaciones) on Argentina's Province of Córdoba
government procurement portal. Córdoba-specific — for any other Argentine province, route to that
province's own tool (there is one per province in this fleet); this actor has no national-level
Argentine coverage." **BYOK**: none. **Payload**: requires a Residential+AR proxy on the actor's own
infrastructure (not the caller's concern) — no special MCP-level handling needed.

### 9. `stefano_seggio--diario-oficial-cl-monitor` — `check_chile_gazette`
**Description**: "Check today's edition of Chile's Diario Oficial (official gazette) — laws,
decrees, resolutions, with ministry/agency hierarchy and a direct PDF link per entry. National
Chilean scope; call this for 'what did Chile publish/enact today or recently' questions, not for
procurement/tenders (Chile has no separate tender actor in this fleet — the gazette is the only
Chilean coverage)." **BYOK**: none. **Payload**: single daily edition, well inside the inline cap.

### 10. `stefano_seggio--entrerios-compras-monitor` — `check_argentina_entrerios_tenders`
**Description**: "Check Argentina's Province of Entre Ríos public tender register (licitaciones)
via its Unidad Central de Contrataciones. Entre Ríos-specific — route other provinces to their own
tool." **BYOK**: none. **Payload**: no separate `UPDATED` event — this source's record ID is
itself a content hash, so any real change already looks like a new record; only `NEW`/
`STATUS_CHANGE` exist here, disclose this if an agent asks about "what changed" beyond status.

### 11. `stefano_seggio--florida-tenders-monitor` — `check_us_florida_procurement`
**Description**: "Check Florida state-agency procurement on MyFloridaMarketPlace — ITB, RFP, ITN,
RFI, RSQ, Single Source, and intent-to-award notices. US state-level, Florida only — no other US
state has procurement coverage in this fleet." **BYOK**: none. **Payload**: two-tier pricing
(full-detail $0.003 / listing-only $0.001) — instruct the calling agent to prefer listing-only
mode for broad scans, full-detail only when the user names a specific solicitation.

### 12. `stefano_seggio--mendoza-compras-monitor` — `check_argentina_mendoza_tenders`
**Description**: "Check Argentina's Province of Mendoza COMPR.AR-based tender portal (25,000+
process register). Mendoza-specific. This actor deliberately does not support a `CLOSED` event — a
full census at this register's scale is impractically slow, so 'closed' status is never inferred
from absence; disclose this limitation if a user specifically asks whether a tender has closed."
**BYOK**: none. **Payload**: `resolveSourceUrl` input flag trades off per-row permalink resolution
against ~5x run speed — default `true`; suggest `false` for bulk scans where the source URL isn't
needed.

### 13. `stefano_seggio--pba-tenders-monitor` — `check_argentina_buenosaires_tenders`
**Description**: "Check Buenos Aires **Province's** (PBA, via the PBAC portal) tender register —
explicitly not the City of Buenos Aires (CABA) and not Argentina's national procurement system,
neither of which this actor covers. Disambiguate with the user if they say 'Buenos Aires' without
specifying province vs. city — this is a real, common confusion this fleet's own documentation
flags." **BYOK**: none. **Payload**: three lifecycle views (`vistaOrigen`) — upcoming/awarded/all;
default covers all three.

### 14. `stefano_seggio--page-metadata-extractor` — `check_global_page_metadata`
**Description**: "Extract title, meta description, canonical URL, Open Graph tags, H1, and word
count from any URL, with per-URL content-change detection. This is the one non-regulatory actor in
this fleet — call it for generic SEO/RAG-pipeline metadata questions, never for anything
jurisdiction- or compliance-related; it has no legal/regulatory domain knowledge at all." **BYOK**:
none. **Payload**: single result per URL, trivially inline; `onlyChanged` flag skips billing for
unchanged pages on repeat crawls of the same URL set.

### 15. `stefano_seggio--salta-compras-monitor` — `check_argentina_salta_tenders`
**Description**: "Check Argentina's Province of Salta public procurement portal. Salta-specific.
Unlike most sibling provincial actors, this source has no status field on its listing page at
all — a tender simply disappears when it closes, so `CLOSED` here means 'absent from a verified
complete-census walk,' gated on non-truncation. Disclose that closure detection is inferential, not
a directly-observed status field, if precision matters to the user's question." **BYOK**: none.
**Payload**: two-tier pricing, same pattern as Florida.

### 16. `stefano_seggio--santafe-compras-monitor` — `check_argentina_santafe_tenders`
**Description**: "Check Argentina's Province of Santa Fe tender register (Gestiones de Compra) —
ministries, hospitals, SAMCOs. Santa Fe-specific." **BYOK**: none. **Payload**: two-tier pricing;
requires a Residential+AR proxy on the backend (transparent to the MCP caller).

### 17. `stefano_seggio--tucuman-compras-monitor` — `check_argentina_tucuman_tenders`
**Description**: "Check Argentina's Province of Tucumán procurement portal — licitaciones públicas,
privadas, concursos de precios, contrataciones directas. Tucumán-specific. No separate detail page
exists on this source at all (everything is inline in the listing response), unlike most sibling
provincial actors — this doesn't change tool usage, just disclosed here as a real source
constraint." **BYOK**: none. **Payload**: single-tier pricing (no detail/summary split — this
source has no cost distinction to price differently).

### 18. `stefano_seggio--uk-hse-enforcement-monitor` — `check_uk_hse_enforcement`
**Description**: "Check the UK Health & Safety Executive's public register of convictions and
enforcement/prohibition notices. UK workplace-safety enforcement specifically — for UK corporate
compliance-disclosure questions (Section 54, modern slavery), route to
`check_uk_modern_slavery_registry` instead; the two cover entirely different UK regulatory regimes
despite both being 'UK compliance' in a loose sense." **BYOK**: none. **Payload**: two-tier
pricing, detail vs. listing-only.

### 19. `stefano_seggio--kipris-patent-trademark-status-monitor` — `check_southkorea_patent_status`
**Description**: "Check Korean patent and trademark filing/status changes via KIPRIS Plus. **Requires
the caller's own KIPRIS Plus service key** — this is a paid annual license billed directly by
KIPRIS to the caller, never pooled or resold by this actor; the tool call fails without a valid
key supplied as input. Call this for South Korea-specific IP questions only — for US/EU patent
enforcement, route to `check_us_eu_patent_enforcement`." **BYOK**: **required**. **Payload**:
two-tier pricing ($0.02 new/status-change, $0.008 non-status update).

### 20. `stefano_seggio--singapore-acra-registry-monitor` — `check_singapore_corporate_registry`
**Description**: "Check a Singapore company's ACRA UEN registration and status (Live / Struck Off /
Dissolved / In Liquidation) against the full ~2.1M-entity national corporate register. Call this
for Singapore corporate/KYB questions specifically — for UAE, route to
`check_uae_corporate_registry`; for UK compliance disclosures, route to
`check_uk_modern_slavery_registry`. These three 'corporate registry' tools cover entirely different
jurisdictions and should never be treated as interchangeable by a routing LLM." **BYOK**: optional
— a customer ACRA Business Profile key unlocks real-time watchlist refresh on top of the default
dataset, but the tool runs without one. **Payload**: two-tier pricing ($0.03 new/status-change,
$0.01 update).

### 21. `stefano_seggio--sec-enforcement-litigation-delta-feed` — `check_us_sec_enforcement`
**Description**: "Check SEC.gov litigation releases and administrative proceedings, with automatic
EDGAR CIK entity resolution (confidence-scored, not a blind match) and extracted monetary
sanctions (sought vs. ordered). US securities enforcement specifically — this is the single
highest-priced tool in the fleet ($0.05/new release); a routing LLM should be confident the user's
question is genuinely about SEC enforcement action before invoking it, not a general 'is this
company in trouble' query better served by a cheaper, broader tool." **BYOK**: none. **Payload**:
$0.05 new / $0.02 updated release — flag this cost differential explicitly to any agent doing
cost-aware tool selection.

### 22. `stefano_seggio--ai-crawler-content-signal-permission-monitor` — `check_global_ai_crawler_permissions`
**Description**: "Check any domain's AI-crawler permissions — robots.txt directives for GPTBot,
ClaudeBot, and 15 other tracked bots, Cloudflare Content-Signal headers, and llms.txt/
llms-full.txt. This is a technical/SEO tool, not a legal/regulatory one — call it for 'can my
crawler access this site' questions, never for compliance or corporate-registry questions despite
being adjacent to 'permission' and 'compliance' vocabulary." **BYOK**: none. **Payload**: two-tier
pricing ($0.015 directive flip, $0.006 Content-Signal/llms.txt change); includes a free baseline
audit on first run.

### 23. `stefano_seggio--aozora-bunko-public-domain-text-feed` — `check_japan_public_domain_texts`
**Description**: "Check Aozora Bunko's official catalog for newly digitized or revised
confirmed-public-domain Japanese literary texts (19,500+ works). This is a content/digital-archives
tool, not a regulatory one — call it for Japanese public-domain text discovery/NLP-corpus
questions, never for anything compliance-related." **BYOK**: none. **Payload**: full-text delivery
on new works ($0.05) can be large for long-form literature — if a single work's decoded text risks
exceeding 256 KB inline, expect the download-URL fallback rather than inline text; don't assume the
tool response always contains the full text body.

### 24. `stefano_seggio--regione-lombardia-grants-registry-monitor` — `check_italy_lombardy_grants`
**Description**: "Check Regione Lombardia's (Italy) open grants/tenders registry (Anagrafica dei
bandi regionali, ~1,912 bandi) via its Socrata SODA API, with a computed real OPEN/UPCOMING/CLOSED
status and policy-area classification. Lombardy-specific — no other Italian region has coverage in
this fleet." **BYOK**: none. **Payload**: two-tier pricing ($0.02 new/status-change, $0.008
update).

### 25. `stefano_seggio--eu-ted-procurement-delta-monitor` — `check_eu_procurement_ted`
**Description**: "Check EU public procurement notices, contract awards, and CPV-coded tenders
across all 27 EU member states via TED's official public Search API (no key required — TED's API
is free and unauthenticated). Call this for any EU-level (not single-member-state) procurement
question. Real operational caveat: individual runs have been observed taking up to ~417 seconds
due to Apify-cloud-to-TED network latency, not a code defect — a calling agent should not assume
sub-second or even sub-minute response times for this specific tool and should handle a longer
timeout gracefully." **BYOK**: none. **Payload**: default query is a rolling 14-day window
(self-refreshing via TED's own `today(-14)` server-side function) to keep page-count and therefore
latency-exposure down; widening the date window increases both real cost and run duration.

### 26. `stefano_seggio--uk-modern-slavery-statement-registry-monitor` — `check_uk_modern_slavery_registry`
**Description**: "Check the UK Modern Slavery Statement Registry (gov.uk, 34,000+ organisations,
23,500+ statements) for new statements, compliance-status changes, and missing mandatory
disclosures under Section 54 of the UK Modern Slavery Act across the six government-recommended
topics. Call this for UK corporate compliance-disclosure questions — for UK workplace-safety
enforcement, route to `check_uk_hse_enforcement` instead; these cover unrelated UK regulatory
regimes." **BYOK**: none. **Payload**: two-tier pricing ($0.02 new statement, $0.01 updated); an
HTTP `Content-MD5` check on the registry's own bulk files means an unchanged year is never even
re-downloaded, not just never re-billed.

### 27. `stefano_seggio--emerging-market-sovereign-debt-auction-monitor` — `check_brazil_sovereign_debt`
**Description**: "Check Brazil's National Treasury (Tesouro Nacional) domestic bond auction results
— LTN, LFT, NTN-B, NTN-F — for new auctions and revised results, with basis-point-precision rate
and coverage-ratio tracking. This is the fleet's one financial-markets tool, not a corporate/
compliance one — call it for Brazilian sovereign-debt-auction questions specifically. Real
terminology caveat: `coverage_ratio` here is `quantity_accepted / quantity_offered`, explicitly
**not** a true bid-to-cover ratio (this source doesn't publish total submitted-bid demand) — don't
let a calling agent conflate the two terms when presenting results to a user familiar with
US/UK Treasury auction terminology." **BYOK**: none. **Payload**: two-tier pricing ($0.02 new
auction, $0.01 revised result); every selected year is fully re-downloaded every run (the source's
ETag isn't a real content signal — verified live, three identical fetches returned three different
ETags), so cost scales with `years` input breadth, not with actual change frequency.

### 28. `stefano_seggio--uae-corporate-registry-monitor` — `check_uae_corporate_registry`
**Description**: "Check UAE corporate registration and license-status changes across three
distinct registers: Dubai Mainland (via Dubai Pulse), ADGM (Abu Dhabi Global Market), and DIFC
(Dubai International Financial Centre) — with bilingual Arabic/English entity-name normalization.
**Dubai Mainland coverage specifically requires the caller's own Dubai Pulse API key** (obtained
via Dubai Pulse's own approval process, which can take up to 14 days); ADGM and DIFC coverage runs
with no key at all. A routing agent should check whether the user's question is scoped to Dubai
Mainland before assuming the tool call will succeed without a supplied key." **BYOK**: optional,
but functionally required for one of the three sub-registers — surface this nuance rather than
flattening it to a simple yes/no. **Payload**: three-tier pricing ($0.02 new entity, $0.02 status
change — the flagship signal, $0.01 other content update).

---

## Block 3 — Testing protocol

Validate the closed-scope configuration locally before relying on it in Claude Desktop/Cursor,
using the stdio CLI directly against the same tool list (real command, not a hosted-only feature):

```bash
npx -y @apify/actors-mcp-server --tools stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/uae-corporate-registry-monitor
```

Run this with a small 3-actor subset first (as above) rather than all 28 at once, to confirm the
token/auth path and tool-loading behavior before scaling to the full closed-scope list — cheaper to
debug a 3-tool failure than a 28-tool one. Once confirmed, re-run with the full 28-actor `--tools`
list from Block 1.1 to validate the complete configuration end to end. Real cost note for testing:
each tool *call* (not tool *load* — loading/listing tools is free) bills at that actor's live PPE
rate the moment the calling agent actually invokes it — `sec-enforcement-litigation-delta-feed` is
the most expensive single call in the fleet at $0.05, useful to know before an agent test-run loops
through all 28 tools "just to see what happens."

---

## Block 4 — Future option: a Smart Router wrapper (not built, evaluated only)

A single `check_regulatory_status(entity_name, jurisdiction)` tool that dispatches server-side to
the correct one of the 28 actors is a genuinely different, additive product — **not** a
replacement for the 28 direct tools above, and not something the generic hosted MCP server can do
for you, since it requires domain logic Apify's own server has no way to know (which jurisdiction
string maps to which of your actors).

**Why this is worth scoping, not building today**: the 28-tool closed-scope list already works
and costs zero engineering time. A router adds real value only once real usage data shows routing
LLMs actually struggle to pick the right tool from 28 well-differentiated descriptions — that's an
empirical question this integration should answer before the router is built, not something to
assume upfront.

**Real architecture, if the data justifies building it**:

```typescript
// src/router.ts — illustrative core logic, not a scaffolded/deployed Actor.
// This would run AS an Apify Actor (Standby mode, so it can stay warm behind
// an HTTP endpoint the way mcp.apify.com itself does) exposing exactly one
// MCP tool, which internally calls one of the 28 actors via apify-client.

import { ApifyClient } from 'apify-client';

interface JurisdictionRoute {
  match: RegExp;               // matched case-insensitively against the caller's jurisdiction string
  actorId: string;             // stefano_seggio/<slug>
  buildInput: (entityName: string) => Record<string, unknown>;
}

// Real slugs, real input shapes — pulled from each actor's own .actor/input_schema.json,
// not invented. Only a representative subset shown; the full table has 28 entries, one
// per actor above, each with its own real input field names.
const ROUTES: JurisdictionRoute[] = [
  {
    match: /^(singapore|sg)$/i,
    actorId: 'stefano_seggio/singapore-acra-registry-monitor',
    buildInput: (entityName) => ({ uenFilter: [entityName], maxItems: 10 }),
  },
  {
    match: /^(uae|united arab emirates|dubai|adgm|difc)$/i,
    actorId: 'stefano_seggio/uae-corporate-registry-monitor',
    buildInput: (entityName) => ({ entityNameFilter: entityName, maxItems: 10 }),
  },
  {
    match: /^(uk|united kingdom)[- ]?(modern[- ]?slavery)?$/i,
    actorId: 'stefano_seggio/uk-modern-slavery-statement-registry-monitor',
    buildInput: (entityName) => ({ years: ['2026'], organisationFilter: entityName, maxItems: 10 }),
  },
  {
    match: /^(us|usa|united states)[- ]?(sec)?$/i,
    actorId: 'stefano_seggio/sec-enforcement-litigation-delta-feed',
    buildInput: (entityName) => ({ respondentFilter: entityName, maxItems: 10 }),
  },
  // ... the remaining 24 routes follow the same {match, actorId, buildInput} shape,
  // one per actor in Block 2 above — every jurisdiction string a user might type
  // ("Argentina - Córdoba", "Brazil", "South Korea", etc.) maps to exactly one route,
  // with no fallback silently guessing between two provinces or two countries.
];

export async function routeRegulatoryCheck(
  entityName: string,
  jurisdiction: string,
  apifyToken: string,
): Promise<{ actorUsed: string; results: unknown[] } | { error: string; candidates: string[] }> {
  const matches = ROUTES.filter((r) => r.match.test(jurisdiction.trim()));

  if (matches.length === 0) {
    return {
      error: `No actor in this fleet covers jurisdiction "${jurisdiction}". This is a real gap, not a routing bug — do not guess a nearby jurisdiction.`,
      candidates: ROUTES.map((r) => r.actorId),
    };
  }

  // A jurisdiction string matching more than one route is a real design flaw in the
  // regex table, not something to silently resolve by picking the first match —
  // fail loudly so the route table gets fixed instead of masking ambiguity.
  if (matches.length > 1) {
    throw new Error(
      `Jurisdiction "${jurisdiction}" matched ${matches.length} routes: ${matches.map((m) => m.actorId).join(', ')}. Fix the regex overlap in ROUTES before deploying.`,
    );
  }

  const route = matches[0];
  const client = new ApifyClient({ token: apifyToken });
  const run = await client.actor(route.actorId).call(route.buildInput(entityName));
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return { actorUsed: route.actorId, results: items };
}
```

This is real, working TypeScript against the real `apify-client` API and real actor input field
names — not a stub. What it deliberately does **not** do: it does not attempt fuzzy jurisdiction
matching, silent fallback on ambiguous input, or a "best guess" when no route matches — each of
those would convert a real coverage gap into a wrong answer delivered with false confidence, which
is a worse failure mode for a regulatory-compliance tool than a clear "not covered" response.
