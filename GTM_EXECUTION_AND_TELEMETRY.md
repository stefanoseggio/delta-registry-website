# GTM Execution & Telemetry

## Corrections made before executing this mandate

**Block 3 (public MCP directory submission) is not included.** This repeats a premise this
session's own research already falsified one turn earlier
(`STRATEGIC_EXPANSION_DECISION_AND_IMPLEMENTATION.md`, Pathway B): MCP directories (Smithery,
PulseMCP, etc.) index servers people operate — a repo, a `smithery mcp publish` target — not
query-string-scoped configurations of someone else's hosted server. There is no `delta-registry`
MCP server to submit; `mcp.apify.com` is Apify's own infrastructure, and Apify's generic
`@apify/actors-mcp-server` is already listed on Smithery under Apify's own name. Building a
submission manifest for a non-existent submission process would waste effort and risk
misrepresenting Apify's infrastructure as Stefano-operated. **The real lever that exists today**:
Apify's own Store-listing quality (categories, descriptions, topics) drives discoverability
through its existing MCP `search-actors` tool — already audited this session
(`apify-store-listing-audit` memory) — no further action needed here beyond what's already done.

**Block 2's "zero-cost" framing was corrected.** Real Apify runs cost real (small) money and —
more importantly — **permanently establish that actor's delta-engine baseline state**. A real
future customer's first run afterward will see today's test data as "already seen," not new. This
is disclosed per-run below, not glossed over.

**The "16 zero-run actors" premise was re-verified, not assumed.** Live re-check via the Apify API
found `uk-hse-enforcement-monitor` now has 4 real runs (real, external activity independent of this
session) — it's excluded from the target list below. The real, current count is **15 actors**, not
16.

---

## Block 1 — Outreach sequences, platform-import-ready

Source: `COMMERCIAL_OUTREACH_PACK.md` (this repo). Copy is reproduced verbatim from that
already-reviewed file — nothing reworded here — reorganized into the field structure Apollo/
Instantly/Lemlist expect (Step / Day / Subject / Body with `{{merge-field}}` syntax, which the
source copy already uses natively) and with real CTA URLs resolved in place of placeholders.

**Real CTA URLs used below** (all verified live and public):
- MCP setup guide: `https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md`
- One-command connect scripts: `https://github.com/stefanoseggio/delta-registry-website/blob/main/connect_mcp.sh` (macOS/Linux) and `.../connect_mcp.ps1` (Windows)
- Live validation proof: `https://github.com/stefanoseggio/delta-registry-website/blob/main/LOCAL_MCP_VALIDATION_REPORT.md`
- Store catalog: `https://apify.com/stefano_seggio`

### ICP 1 — Compliance / LegalTech Directors (email sequence)

| Step | Day | Subject | Body |
|---|---|---|---|
| A1 | 0 | How are you tracking [specific register] changes right now? | Hi {{FirstName}},<br><br>Quick question: when {{specific registry — e.g. "a company on your watchlist gets struck off ACRA" or "SEC files a new enforcement release against a counterparty"}} happens, how does your team find out? Most compliance teams I've talked to are either manually re-checking a government portal on a schedule, or paying for a broad compliance-data platform that bundles in a hundred data sources they don't use to get the one they need.<br><br>I run Delta Registry — 28 narrow, single-purpose monitors, each wrapping exactly one public regulatory or corporate register (SEC enforcement, UK Modern Slavery Statement Registry, Singapore ACRA, UAE corporate registries, EU TED procurement, and 23 others). Each one is delta-tracked: you're billed only when a record is genuinely new or changed — an unchanged record costs $0.00, every run, forever. No subscription, no seat licenses, no bundled coverage you're not using.<br><br>Worth 15 minutes to see if one of the 28 already covers something you're checking by hand?<br><br>{{Signature}} |
| A2 | 4 (if no reply) | The actual per-event cost | Hi {{FirstName}},<br><br>Following up — in case it's useful without a call: {{specific actor}} is priced at {{real per-event price, e.g. "$0.05 per new SEC enforcement release, $0.02 per updated one"}}. That's the entire cost model — no platform fee, no minimum commitment. You can see the exact pricing, delta-event types, and BYOK requirements (a few of the 28 need your own free source API key — disclosed per-actor, never hidden) directly on the Store listing: {{store URL}}.<br><br>If it's a "maybe later" rather than a "no," I'll leave it there — no further follow-up unless you reach back out.<br><br>{{Signature}} |
| B1 | 0 | Your compliance team's AI agents can call this directly | Hi {{FirstName}},<br><br>If your team is already using Claude, Cursor, or an internal LangChain/CrewAI agent for compliance research, this might save you a build: our 28 regulatory/corporate-registry monitors are already callable as native tools through Apify's hosted MCP server — no custom API integration, no scraper to maintain on your side. Point Claude Desktop or Cursor at one URL and every one of the 28 becomes a tool your analysts (or their agents) can invoke directly, billed per real event at Apify's standard Pay-Per-Event rate.<br><br>Full config (tested end-to-end against a live run, not just documented): https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md<br><br>Happy to walk through which of the 28 actually maps to your current watchlist coverage if that's useful.<br><br>{{Signature}} |
| B2 | 5 (if no reply) | One more thing — the honesty policy | Hi {{FirstName}},<br><br>Last note from me on this: every actor's README discloses what it explicitly does *not* cover — e.g., the World Bank procurement monitor excludes ADB and IDB because they're Cloudflare-gated/robots.txt-blocked rather than force-scraped, and the clinical-trials actor discloses it doesn't track FDA Complete Response Letters since no queryable API exists for that data. If a scoped, honestly-documented monitor beats a black-box platform for your use case, here's the full catalog: https://apify.com/stefano_seggio<br><br>{{Signature}} |

### ICP 2 — Quantitative Hedge Fund Data Engineers (LinkedIn sequence — not CSV-importable; send via LinkedIn directly)

**Message 1**
> Hi {{FirstName}} — saw you're building data infra for {{fund/team}}. I run a small pay-per-event monitor on Brazil's Tesouro Nacional domestic bond auctions (LTN/LFT/NTN-B/NTN-F) — basis-point-precision rate tracking and coverage-ratio anomaly detection, sourced directly from Tesouro Transparente. It's one of 28 actors in a broader regulatory/financial-data fleet, and it's callable natively as an MCP tool if your stack already talks to Claude/Cursor/LangGraph — no scraper to build or maintain on your end. Worth a quick look if EM sovereign debt is in scope for your desk?

**Message 2**
> Hi {{FirstName}} — following up in case this is more relevant to your compliance/risk side than your quant side: same fleet also includes a real-time-ish (schedule-driven, delta-tracked) SEC enforcement/litigation feed with automatic EDGAR CIK entity resolution — useful if you're cross-referencing counterparty enforcement risk against portfolio holdings. Both actors (and the other 26) are priced strictly per genuinely-new-or-changed event, no subscription. Happy to send the exact schema/pricing for either if useful, no pressure either way.

### ICP 3, Sub-Track A — End-User Corporates (email sequence)

| Step | Day | Subject | Body |
|---|---|---|---|
| A1 | 0 | How many portals is your team checking by hand? | Hi {{FirstName}},<br><br>A quick, specific question: does {{Company}} currently screen vendors/counterparties against OFAC's vessel sanctions list, or track tenders across government procurement portals in more than one country? If so, is that a scheduled manual check, or something automated?<br><br>I run 28 narrow, single-source monitors on Apify — each one wraps exactly one public register (OFAC/UN vessel sanctions, UAE corporate registries across Dubai Mainland/ADGM/DIFC, Singapore ACRA, government tenders across 12 portals in Argentina, Chile, Florida, Australia, the UK, and the EU). Every one is delta-tracked and schedule-driven — you set the cadence, and you're billed only when a record is genuinely new or changed. An unchanged check costs $0.00, every run.<br><br>If {{Company}} already has a compliance stack, this likely plugs in underneath it rather than replacing anything. Worth 15 minutes to see which of the 28 actually maps to what you're covering today?<br><br>{{Signature}} |
| A2 | 5 (if no reply) | Runs directly in Claude/Cursor if your team already uses either | Hi {{FirstName}},<br><br>One more angle in case it's more useful than the first note: if anyone on your compliance or procurement team already uses Claude Code, Claude Desktop, or Cursor, every one of these 28 monitors is already callable as a native tool — no integration project, no API client to build. Connect once, and an analyst (or their own agent workflow) can ask "check this vessel against OFAC" or "any new UAE corporate filings for this entity" directly, billed per real event on your own Apify account.<br><br>Setup is a single script that prompts for your own Apify token and never leaves your machine — macOS/Linux: https://github.com/stefanoseggio/delta-registry-website/blob/main/connect_mcp.sh · Windows: https://github.com/stefanoseggio/delta-registry-website/blob/main/connect_mcp.ps1 · full config: https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md<br><br>If it's still not the right fit, no further follow-up from me.<br><br>{{Signature}} |

### ICP 3, Sub-Track B — RegTech / OEM Vendors (email sequence)

| Step | Day | Subject | Body |
|---|---|---|---|
| B1 | 0 | A wholesale data layer, not a competing product | Hi {{FirstName}},<br><br>Reaching out because {{Company}} builds {{their real product category — e.g. "KYB/sanctions screening software"}}, and I run 28 narrow, single-source monitors that might be a cheaper, faster wholesale layer under what you already ship, rather than something that competes with it.<br><br>Each monitor wraps exactly one public register (OFAC/UN vessel sanctions, UAE corporate registries, Singapore ACRA, SEC enforcement with EDGAR CIK resolution, UK Modern Slavery Statement Registry, and 23 others) at real, published Pay-Per-Event pricing — from $0.0005 to $0.05 per event depending on the source, no negotiation required to see the real number. If you're currently building and maintaining your own scrapers against any of these same sources, the honest comparison is your fully-loaded maintenance cost against our per-event price, not a feature list.<br><br>Every actor's own documentation discloses what it explicitly does *not* cover — which matters more to a vendor reselling this under your own brand than to an end-user, since a hidden gap in a data source you didn't build becomes a support ticket against your product, not ours. Worth a technical call to see if any of the 28 covers a source you're currently maintaining in-house?<br><br>{{Signature}} |
| B2 | 6 (if no reply) | The actual integration surface, if useful without a call | Hi {{FirstName}},<br><br>In case a call isn't the right next step yet: the full technical integration surface is public — https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md for the native MCP/agent-tooling path, or direct Apify API calls (`apify-client` in Python/Node) if you'd rather pull data into your own pipeline without an agent layer at all. Either way, the underlying data contract (a shared UMS envelope — `event_type`, content/status fingerprints, `record_id`) is the same regardless of which integration path you pick, so evaluating one doesn't lock you into the other.<br><br>If OEM/wholesale data partnerships are handled by someone else on your team, a pointer in their direction would be genuinely useful — otherwise I'll leave this here.<br><br>{{Signature}} |

**RegTech Systems Architects — LinkedIn InMail (not CSV-importable; send via LinkedIn directly)**

> **InMail 1**: Hi {{FirstName}} — technical question, not a sales pitch: if you're evaluating third-party regulatory/registry data sources to embed in {{Company}}'s product, how are you currently handling schema drift when an upstream source (a government portal, a sanctions list) changes shape under you? I run 28 single-source Apify actors, each with a shared UMS output envelope (`event_type`, `record_id`, separate content/status fingerprints) so a consuming integration doesn't need bespoke parsing per source. Full real output schemas are documented per-actor, not abstracted away — happy to send the exact schema for whichever source is closest to something you're already covering.
>
> **InMail 2**: Hi {{FirstName}} — following up with something concrete rather than another pitch: every one of the 28 actors is independently callable via Apify's hosted MCP server (real JSON-RPC 2.0 over Streamable HTTP, no proprietary transport), and I validated the full round-trip live — real `tools/call`, real Apify run ID, real schema-valid data back, in about 11 seconds for a lightweight source. Full validation log: https://github.com/stefanoseggio/delta-registry-website/blob/main/LOCAL_MCP_VALIDATION_REPORT.md

### Technical pitch sheet (attach to any reply, or send standalone)

See `COMMERCIAL_OUTREACH_PACK.md` Block 3, unchanged — real pricing range ($0.0005–$0.05/event), real MCP latency figures (11.2s typical, 417s disclosed EU TED outlier), real BYOK disclosure (3 of 28 actors), no compliance-certification claims.

---

## Block 2 — Zero-production-run actors: real test-execution script, verified

Real script: [`run_baseline_telemetry_tests.py`](run_baseline_telemetry_tests.py), committed to this repo. Not a placeholder — actually run and verified below, not just written.

### Real, current target list (15 actors re-verified live, not assumed from memory)

13 actors get a minimal-footprint test input (capped `maxItems`/`maxPages`/`maxItemsPerSource` at 1–3, read from each actor's own real input schema). 2 are excluded with a named reason:

| Actor | Status |
|---|---|
| kipris-patent-trademark-status-monitor | **Excluded** — `byoKiprisServiceKey` is a required input field; no key available. Cannot be run without Stefano's own KIPRIS Plus subscription key. |
| cordoba-compras-monitor | **Excluded** — requires a paid Residential+AR Apify Proxy; real, non-trivial cost distinct from ordinary PPE micro-costs. Needs an explicit go-ahead on proxy budget before running. |

### Real proof this works — already executed on 1 of 13, not simulated

```
=== LIVE - launching real Apify runs. Real (small) cost will be incurred. ===

  [LAUNCH] actor-18-b2b-lead-magnet: input={}
           launched: runId=epQglWhGBfdXhMhgT status=READY

Launched 1 real runs. Run IDs saved to launched_run_ids.json.
```

Checked ~15 seconds later, real result:

```
  actor-18-b2b-lead-magnet: status=SUCCEEDED runTimeSecs=2.513 memMaxBytes=51998720 computeUnits=0.0003490277777777778 datasetId=tyvGxaDnFGbEz85XP
```

Real, verified: 2.513s runtime, ~52MB peak memory, ~0.00035 compute units (a fraction of a cent). `actor-18-b2b-lead-magnet` is no longer a zero-run actor — this is the real, disclosed side effect described above, now actually true for this one actor.

### The remaining 12 — executed, real results

Run on explicit authorization. One real bug found and fixed in the process: `page-metadata-extractor`'s test input used `startUrls: ["https://example.com"]` (bare strings) — Apify's real validation rejected it (`400 Bad Request: Items in input.startUrls at positions [0] do not contain valid URLs`). Apify's standard URL-list format requires objects, not strings. Fixed to `startUrls: [{"url": "https://example.com"}]`, re-verified with a real successful launch, and corrected permanently in the committed script. 11 of 12 launched clean on the first attempt; the 12th succeeded on retry with the corrected input.

All 13 real runs (including the earlier `actor-18-b2b-lead-magnet` proof-of-concept) now show **SUCCEEDED**, with real per-run cost pulled directly from each run's own `usageTotalUsd` — not estimated from compute units:

| Actor | Status | Runtime (s) | Peak Memory | Real Cost (USD) | Dataset ID |
|---|---|---|---|---|---|
| actor-18-b2b-lead-magnet | SUCCEEDED | 2.513 | 50 MB | $0.000181 | tyvGxaDnFGbEz85XP |
| actor-20-mdb-procurement-monitor | SUCCEEDED | 2.715 | 56 MB | $0.000217 | 0aUIHQVCNcZMnZvrZ |
| actor-21-patent-ip-enforcement-monitor | SUCCEEDED | 2.918 | 49 MB | $0.000141 | M7CzSsOZTg6ny9gx2 |
| actor-22-drug-safety-recalls-monitor | SUCCEEDED | 4.001 | 46 MB | $0.000303 | ugdJRSvMXt9hw506n |
| actor-24-clinical-trials-delta-engine | SUCCEEDED | 8.533 | 49 MB | $0.000916 | M5apxteCuepkc4sYL |
| australia-grantconnect-monitor | SUCCEEDED | 8.801 | 57 MB | $0.000468 | MOZdb9w0dLxNPG3yE |
| entrerios-compras-monitor | SUCCEEDED | 4.691 | 138 MB | $0.000260 | J26pZDn4sVTRtNxsL |
| florida-tenders-monitor | SUCCEEDED | 7.031 | 37 MB | $0.000417 | cnzqHbfL50FVAbmZJ |
| page-metadata-extractor | SUCCEEDED | 8.284 | 96 MB | $0.000492 | 4LbMtd9VEaIS7cVhx |
| pba-tenders-monitor | SUCCEEDED | 5.917 | 103 MB | $0.000743 | UNHvfOuDEgrXbqqcL |
| salta-compras-monitor | SUCCEEDED | 8.390 | 39 MB | $0.000360 | 7PpukOf5p5OCDcxPF |
| santafe-compras-monitor | SUCCEEDED | 7.787 | 43 MB | $0.000438 | HAgdJjhGfsneuGqaU |
| tucuman-compras-monitor | SUCCEEDED | 3.550 | 50 MB | $0.000225 | bUBVcnOJME33HmGZe |

**Total real cost across all 13 runs: $0.005163** — every individual run and the fleet-wide total are well under one cent, confirming the sub-cent-micro-cost bound with real, verified numbers rather than an assumption.

**Real, disclosed side effect, now true for all 13**: each of these actors has moved from zero-production-run to a real, established delta baseline. A future customer's first run on any of these 13 will now see today's test data as the starting state, not as new. This was the known, disclosed tradeoff of running this test — not a surprise.

**Still not run — same 2, same reasons, unchanged:**

| Actor | Status |
|---|---|
| kipris-patent-trademark-status-monitor | Paused — requires Stefano's own `byoKiprisServiceKey`, a required field with no key available. |
| cordoba-compras-monitor | Paused — requires a paid Residential+AR Apify Proxy, a real non-trivial cost distinct from the micro-costs above. Needs an explicit proxy-budget decision before running. |
