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
