# Delta Registry — Commercial Outreach Pack

A note on framing before the copy: every claim below is worded to match what's actually been
verified this session, not what would sound best. The fleet is **delta-tracked and
schedule-driven** (a customer configures the cadence via their own Apify Scheduler), not a
literal real-time push stream — so this copy says "the instant your scheduled run finds a change"
and "zero-cost on unchanged runs," never "real-time" or "live streaming," which would overclaim a
capability the actors don't have. The one real latency data point available (the live MCP
validation run: ~11.2 seconds for a full tool-call round trip on a cheap actor, ~417 seconds
observed on the EU TED actor specifically) is used where it's genuinely relevant, not smoothed
into a single misleading "fast" claim.

---

## Block 1: Cold email sequences — Compliance / LegalTech Directors

### Sequence A — "The alert you're not getting"

**Email 1 (Day 0) — Subject: How are you tracking [specific register] changes right now?**

> Hi {{FirstName}},
>
> Quick question: when {{specific registry — e.g. "a company on your watchlist gets struck off
> ACRA" or "SEC files a new enforcement release against a counterparty"}} happens, how does your
> team find out? Most compliance teams I've talked to are either manually re-checking a government
> portal on a schedule, or paying for a broad compliance-data platform that bundles in a hundred
> data sources they don't use to get the one they need.
>
> I run Delta Registry — 28 narrow, single-purpose monitors, each wrapping exactly one public
> regulatory or corporate register (SEC enforcement, UK Modern Slavery Statement Registry,
> Singapore ACRA, UAE corporate registries, EU TED procurement, and 23 others). Each one is
> delta-tracked: you're billed only when a record is genuinely new or changed — an unchanged
> record costs $0.00, every run, forever. No subscription, no seat licenses, no bundled coverage
> you're not using.
>
> Worth 15 minutes to see if one of the 28 already covers something you're checking by hand?
>
> {{Signature}}

**Email 2 (Day 4, if no reply) — Subject: The actual per-event cost**

> Hi {{FirstName}},
>
> Following up — in case it's useful without a call: {{specific actor}} is priced at
> {{real per-event price from lib/actors.ts, e.g. "$0.05 per new SEC enforcement release, $0.02
> per updated one"}}. That's the entire cost model — no platform fee, no minimum commitment. You
> can see the exact pricing, delta-event types, and BYOK requirements (a few of the 28 need your
> own free source API key — disclosed per-actor, never hidden) directly on the Apify Store listing:
> {{store URL}}.
>
> If it's a "maybe later" rather than a "no," I'll leave it there — no further follow-up unless you
> reach back out.
>
> {{Signature}}

### Sequence B — "Built for agents, not just dashboards"

**Email 1 (Day 0) — Subject: Your compliance team's AI agents can call this directly**

> Hi {{FirstName}},
>
> If your team is already using Claude, Cursor, or an internal LangChain/CrewAI agent for
> compliance research, this might save you a build: our 28 regulatory/corporate-registry monitors
> are already callable as native tools through Apify's hosted MCP server — no custom API
> integration, no scraper to maintain on your side. Point Claude Desktop or Cursor at one URL and
> every one of the 28 becomes a tool your analysts (or their agents) can invoke directly, billed
> per real event at Apify's standard Pay-Per-Event rate.
>
> Full config (tested end-to-end against a live run, not just documented) is public:
> {{MCP_INTEGRATION.md URL}}.
>
> Happy to walk through which of the 28 actually maps to your current watchlist coverage if that's
> useful.
>
> {{Signature}}

**Email 2 (Day 5, if no reply) — Subject: One more thing — the honesty policy**

> Hi {{FirstName}},
>
> Last note from me on this: every actor's README discloses what it explicitly does *not* cover —
> e.g., the World Bank procurement monitor excludes ADB and IDB because they're
> Cloudflare-gated/robots.txt-blocked rather than force-scraped, and the clinical-trials actor
> discloses it doesn't track FDA Complete Response Letters since no queryable API exists for that
> data. If a scoped, honestly-documented monitor beats a black-box platform for your use case,
> here's the full catalog: {{Apify Store profile URL}}.
>
> {{Signature}}

---

## Block 2: Cold LinkedIn messages — Quantitative Hedge Fund Data Engineers

**Message 1**

> Hi {{FirstName}} — saw you're building data infra for {{fund/team}}. I run a small
> pay-per-event monitor on Brazil's Tesouro Nacional domestic bond auctions (LTN/LFT/NTN-B/NTN-F) —
> basis-point-precision rate tracking and coverage-ratio anomaly detection, sourced directly from
> Tesouro Transparente. It's one of 28 actors in a broader regulatory/financial-data fleet, and
> it's callable natively as an MCP tool if your stack already talks to Claude/Cursor/LangGraph —
> no scraper to build or maintain on your end. Worth a quick look if EM sovereign debt is in scope
> for your desk?

**Message 2**

> Hi {{FirstName}} — following up in case this is more relevant to your compliance/risk side than
> your quant side: same fleet also includes a real-time-ish (schedule-driven, delta-tracked) SEC
> enforcement/litigation feed with automatic EDGAR CIK entity resolution — useful if you're
> cross-referencing counterparty enforcement risk against portfolio holdings. Both actors (and the
> other 26) are priced strictly per genuinely-new-or-changed event, no subscription. Happy to send
> the exact schema/pricing for either if useful, no pressure either way.

---

## Block 3: One-page technical pitch sheet

**Delta Registry — Regulatory & Financial Data Infrastructure**

*28 production Actors on Apify. Delta-tracked. Pay-per-event. No subscriptions.*

**What it is**: 28 independently-deployed, single-purpose data actors, each wrapping exactly one
public regulatory, corporate-registry, procurement, or financial-market source with no first-party
API of its own. Domains: trade sanctions, multilateral development finance, patent/IP enforcement,
pharma safety & clinical trials, corporate registries (Singapore, UAE, UK), sovereign debt markets
(Brazil), and government procurement across 12 official portals in Argentina, Chile, Florida,
Australia, the UK, and the EU.

**Pricing model**: strictly Pay-Per-Event. Real range across the fleet: **$0.0005 per record**
(maritime sanctions screening) to **$0.05 per event** (new SEC enforcement release) — every actor's
exact price is published live on its own Apify Store listing, not negotiated or hidden behind a
sales call. An unchanged record on a repeat run costs **$0.00**, enforced at the platform billing
layer, not just claimed in marketing copy.

**Integration**: native Model Context Protocol (MCP) support via Apify's own hosted server — no
custom API client, no SDK, no infrastructure to run. Verified end-to-end on 2026-09-17/18: a real
MCP `tools/call` against the maritime-sanctions actor completed in **11.2 seconds** round-trip
(cold actor start included) and returned real, schema-valid OFAC SDN vessel records. One actor in
the fleet (EU TED procurement) has a disclosed, real latency outlier — up to **417 seconds**
observed on a wide date-range query, root-caused to Apify-cloud-to-TED network latency, not a code
defect, and mitigated by a narrowed default query window.

**Security posture**: the fleet's own marketing site runs a genuine hardened Content-Security-Policy
(nonce-based `script-src`, no `unsafe-inline`), `X-Frame-Options: DENY`, and standard HSTS/
`Permissions-Policy` headers. **No compliance certifications are claimed anywhere** — Delta Registry
holds no SOC 2 or ISO 27001 certification, and this pitch sheet will not imply otherwise. What's
real: every actor's own README discloses its exact scope limitations (excluded sources, BYOK
requirements, known latency/reliability caveats) rather than presenting universal coverage.

**BYOK disclosure**: 3 of the 28 actors require or optionally accept a customer-supplied
third-party API key (USPTO Open Data Portal for US patent enforcement, KIPRIS Plus for Korean
patent/trademark status, Dubai Pulse for UAE mainland trade-license coverage specifically). This is
disclosed per-actor, never hidden until after purchase.

**Contact**: {{email}} · GitHub: github.com/stefanoseggio · Apify Store: apify.com/stefano_seggio

---

## Block 4: ICP 3 outreach — Corporate Procurement & Sanctions Screening Platforms

Two genuinely different buyers, two genuinely different pitches — a corporate compliance director
buying a tool to reduce their own operational risk is not the same conversation as a RegTech
vendor's Product Manager evaluating a wholesale data source to embed in their own product. Sending
either sequence to the wrong sub-track would read as generic and probably hurt reply rates more
than sending nothing.

### Sub-Track A — End-User Corporates (VP of Corporate Compliance / Procurement Directors)

**Sequence A1 — Subject: How many portals is your team checking by hand?**

> Hi {{FirstName}},
>
> A quick, specific question: does {{Company}} currently screen vendors/counterparties against
> OFAC's vessel sanctions list, or track tenders across government procurement portals in more than
> one country? If so, is that a scheduled manual check, or something automated?
>
> I run 28 narrow, single-source monitors on Apify — each one wraps exactly one public register
> (OFAC/UN vessel sanctions, UAE corporate registries across Dubai Mainland/ADGM/DIFC, Singapore
> ACRA, government tenders across 12 portals in Argentina, Chile, Florida, Australia, the UK, and
> the EU). Every one is delta-tracked and schedule-driven — you set the cadence, and you're billed
> only when a record is genuinely new or changed. An unchanged check costs $0.00, every run.
>
> If {{Company}} already has a compliance stack, this likely plugs in underneath it rather than
> replacing anything. Worth 15 minutes to see which of the 28 actually maps to what you're covering
> today?
>
> {{Signature}}

**Sequence A2 (Day 5, if no reply) — Subject: Runs directly in Claude/Cursor if your team already uses either**

> Hi {{FirstName}},
>
> One more angle in case it's more useful than the first note: if anyone on your compliance or
> procurement team already uses Claude Code, Claude Desktop, or Cursor, every one of these 28
> monitors is already callable as a native tool — no integration project, no API client to build.
> Connect once, and an analyst (or their own agent workflow) can ask "check this vessel against
> OFAC" or "any new UAE corporate filings for this entity" directly, billed per real event on your
> own Apify account.
>
> Setup is a single script (`connect_mcp.sh` / `connect_mcp.ps1`) that prompts for your own Apify
> token and never leaves your machine — full config here: {{MCP_INTEGRATION.md URL}}.
>
> If it's still not the right fit, no further follow-up from me.
>
> {{Signature}}

### Sub-Track B — RegTech / Compliance Software Vendors (Product Managers / OEM Data Partnership Leads)

**Sequence B1 — Subject: A wholesale data layer, not a competing product**

> Hi {{FirstName}},
>
> Reaching out because {{Company}} builds {{their real product category — e.g. "KYB/sanctions
> screening software"}}, and I run 28 narrow, single-source monitors that might be a cheaper,
> faster wholesale layer under what you already ship, rather than something that competes with it.
>
> Each monitor wraps exactly one public register (OFAC/UN vessel sanctions, UAE corporate
> registries, Singapore ACRA, SEC enforcement with EDGAR CIK resolution, UK Modern Slavery
> Statement Registry, and 23 others) at real, published Pay-Per-Event pricing — from $0.0005 to
> $0.05 per event depending on the source, no negotiation required to see the real number. If
> you're currently building and maintaining your own scrapers against any of these same sources,
> the honest comparison is your fully-loaded maintenance cost against our per-event price, not a
> feature list.
>
> Every actor's own documentation discloses what it explicitly does *not* cover — which matters
> more to a vendor reselling this under your own brand than to an end-user, since a hidden gap in a
> data source you didn't build becomes a support ticket against your product, not ours. Worth a
> technical call to see if any of the 28 covers a source you're currently maintaining in-house?
>
> {{Signature}}

**Sequence B2 (Day 6, if no reply) — Subject: The actual integration surface, if useful without a call**

> Hi {{FirstName}},
>
> In case a call isn't the right next step yet: the full technical integration surface is public —
> {{MCP_INTEGRATION.md URL}} for the native MCP/agent-tooling path, or direct Apify API calls
> (`apify-client` in Python/Node) if you'd rather pull data into your own pipeline without an
> agent layer at all. Either way, the underlying data contract (a shared UMS envelope —
> `event_type`, content/status fingerprints, `record_id`) is the same regardless of which
> integration path you pick, so evaluating one doesn't lock you into the other.
>
> If OEM/wholesale data partnerships are handled by someone else on your team, a pointer in their
> direction would be genuinely useful — otherwise I'll leave this here.
>
> {{Signature}}

### LinkedIn InMail — RegTech Systems Architects (the technical evaluator within Sub-Track B)

This persona is not the commercial decision-maker Sequence B1/B2 targets — they're the person who
actually has to integrate and maintain whatever data source gets chosen, and they'll kill a deal a
Product Manager likes if the integration looks fragile. The pitch here is entirely technical.

**InMail 1**

> Hi {{FirstName}} — technical question, not a sales pitch: if you're evaluating third-party
> regulatory/registry data sources to embed in {{Company}}'s product, how are you currently
> handling schema drift when an upstream source (a government portal, a sanctions list) changes
> shape under you? I run 28 single-source Apify actors, each with a shared UMS output envelope
> (`event_type`, `record_id`, separate content/status fingerprints) so a consuming integration
> doesn't need bespoke parsing per source. Full real output schemas are documented per-actor, not
> abstracted away — happy to send the exact schema for whichever source is closest to something
> you're already covering.

**InMail 2**

> Hi {{FirstName}} — following up with something concrete rather than another pitch: every one of
> the 28 actors is independently callable via Apify's hosted MCP server (real JSON-RPC 2.0 over
> Streamable HTTP, no proprietary transport), and I validated the full round-trip live — real
> `tools/call`, real Apify run ID, real schema-valid data back, in about 11 seconds for a
> lightweight source. Full validation log (real run ID, real latency numbers, not rounded) is
> public if you want to see the actual protocol trace before a first call:
> {{LOCAL_MCP_VALIDATION_REPORT.md URL}}.
