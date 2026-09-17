# GTM Execution & Targeting Matrix

**Scope note**: this document is a planning and reference artifact — ICP definitions, search
parameters for third-party prospecting tools, and an execution pipeline structure. It does not
constitute, and was not used to perform, any actual outreach: no emails were sent, no LinkedIn
messages were sent, and no search was executed inside Sales Navigator, Apollo, or ZoomInfo. Those
remain manual actions for whoever runs this campaign, using the parameters below as a starting
point, not a completed prospecting list.

---

## Block 2: Ideal Customer Profiles & targeting matrix

### ICP 1 — Enterprise Compliance & LegalTech Developers

**Real hook**: native MCP tool integration — every one of the 28 actors is already callable
directly from Claude Code, Claude Desktop, or Cursor with no custom API client, verified end-to-end
against a live run (`LOCAL_MCP_VALIDATION_REPORT.md`). This ICP cares about integration friction
more than raw data breadth, so the pitch leads with "connect in one command," not with a feature
list.

**Who, specifically**: teams that have already adopted or are actively piloting AI coding/agent
tooling (Claude Code, Cursor, an internal LangGraph/CrewAI agent) *and* sit inside or adjacent to a
compliance function — the overlap is the actual target, not "any compliance person" or "any
developer."

**Real actors most relevant to this ICP**: `sec-enforcement-litigation-delta-feed`,
`uk-modern-slavery-statement-registry-monitor`, `actor-19-maritime-sanctions-monitor`,
`singapore-acra-registry-monitor`, `uae-corporate-registry-monitor` — the registry/enforcement/
compliance-disclosure cluster, not the pure-procurement actors (those map better to ICP 3).

**LinkedIn Sales Navigator — real, stable filter categories, mapped to this ICP**:

- **Job title (current)**: `"Head of Compliance Technology" OR "Compliance Engineering" OR "RegTech" OR "Legal Engineering" OR "Director of Regulatory Affairs" OR "VP Compliance"` — boolean OR string in the Title filter, not a single exact-match title, since this exact role is titled inconsistently across companies.
- **A second, separate search** (Sales Navigator doesn't reliably let you AND two different people's titles in one search — run these as two lists and intersect by company): `"Head of AI" OR "AI Platform Lead" OR "Developer Experience" OR "Internal Tools"` filtered to companies you've already identified from the first search, to find the technical counterpart at the same compliance-heavy company.
- **Seniority level filter**: Director, VP, Head — exclude individual-contributor-only titles for the first pass; a Director+ is the realistic buyer/champion for a paid data-integration decision.
- **Industry filter**: Legal Services, Financial Services, Investment Banking, Law Practice, Government Relations Services — company must plausibly have a real compliance function, not just "Technology."
- **Company headcount**: 501–5,000+ — narrow enough to exclude micro-startups without a formal compliance function, broad enough not to require a Fortune 500-only enterprise sales motion.
- **Keyword filter (profile-wide, not just title)**: `"MCP" OR "Model Context Protocol" OR "Claude" OR "Cursor"` — a real, high-signal filter for this specific ICP that most generic compliance-outreach campaigns wouldn't think to use; someone whose LinkedIn already mentions MCP/Claude/Cursor is measurably closer to the sale than someone who doesn't.

**Apollo.io / ZoomInfo — real filter categories, same ICP**:

- **Job title**: same boolean structure as above, translated to Apollo's title-contains filter (Apollo supports comma-separated OR logic directly in the Title field, no boolean syntax needed).
- **Management level**: Director, VP, Head/C-Suite.
- **Department**: Legal, Compliance (Apollo's own department taxonomy includes both as distinct filterable values).
- **Technologies used** (Apollo-specific, real filter, high value for this ICP): filter for companies whose tech stack includes `Anthropic` / `Claude` / `Cursor` / `LangChain` — Apollo's technology-detection dataset picks these up from job postings, changelogs, and public tech-stack disclosures; a company already showing up under this filter is pre-qualified for the MCP-integration pitch specifically.
- **Company industry (NAICS/SIC)**: Legal Services (5411), Investment Advice (523930), Insurance Carriers (524).

### ICP 2 — Quantitative Hedge Funds & Risk Analysts

**Real hook**: zero-cost-on-unchanged delta monitoring — the pitch is billing efficiency and signal
precision (only pay when something genuinely changed), not data breadth. This ICP is naturally
skeptical of vague "regulatory intelligence" claims and responds better to a single, precise,
real capability than a broad platform pitch.

**Real actors most relevant**: `emerging-market-sovereign-debt-auction-monitor` (the fleet's one
genuine financial-markets actor — real basis-point-precision Brazil Treasury auction tracking) and
`sec-enforcement-litigation-delta-feed` (counterparty enforcement-risk cross-reference via EDGAR
CIK resolution) — these two actors, not the full 28, are the actual relevant surface for this ICP;
overselling the other 26 (mostly government-tender monitors) to a quant desk would be noise, not
signal.

**LinkedIn Sales Navigator**:

- **Job title**: `"Quantitative Analyst" OR "Quantitative Researcher" OR "Data Engineer" OR "Head of Data" OR "VP Risk" OR "Director of Risk Management"`.
- **Industry filter**: Investment Management, Hedge Funds (Sales Navigator's own industry taxonomy includes "Investment Management" as a distinct value — use it directly rather than a broader "Financial Services" filter, which would pull in retail banking and insurance noise).
- **Company headcount**: 11–1,000 — hedge funds' data/quant teams are real but typically small relative to headcount, so this ICP skews toward smaller total company size than ICP 1 even at firms managing large AUM; don't filter this one the same way as enterprise compliance.
- **Keyword filter**: `"emerging markets" OR "sovereign debt" OR "fixed income" OR "EM debt"` — directly matches the one actor genuinely relevant to this ICP, filtering out generalist quant roles with no EM/fixed-income focus.

**Apollo.io / ZoomInfo**:

- **Job title**: same OR-list as above.
- **Department**: Finance, Data/Analytics.
- **Company industry (NAICS)**: Investment Advice (523930), Portfolio Management (523920), Trust/Fiduciary/Custody Activities (523991) — Apollo's NAICS-level filtering is more precise here than a generic "Financial Services" tag.
- **Technologies used**: filter for `Bloomberg Terminal` / `Refinitiv` / `Snowflake` / `dbt` — real signal that a target company has an active quant-data pipeline this fleet could plug into, versus a firm still running everything through spreadsheets (lower near-term fit).

### ICP 3 — Corporate Procurement & Sanctions Screening Platforms

**Real hook**: this ICP splits into two real sub-segments that need different framing —
(a) **end-user corporates** doing their own vendor/supplier sanctions screening and government
tender sourcing, and (b) **compliance-software vendors** who might OEM/resell the underlying data
rather than build their own scrapers. Conflating these two into one pitch would weaken both.

**Real actors most relevant**: `actor-19-maritime-sanctions-monitor`, `actor-20-mdb-procurement-monitor`,
the 7 Argentine provincial tender actors + `florida-tenders-monitor` + `australia-grantconnect-monitor`
+ `eu-ted-procurement-delta-monitor` (the full government-procurement cluster — this ICP is the one
place the fleet's breadth, not just one flagship actor, is the actual selling point), plus
`uae-corporate-registry-monitor` and `singapore-acra-registry-monitor` for vendor/counterparty KYB.

**LinkedIn Sales Navigator — sub-segment (a), end-user corporates**:

- **Job title**: `"VP Procurement" OR "Head of Third-Party Risk" OR "Sanctions Screening" OR "Vendor Risk Management" OR "Head of Supplier Compliance" OR "KYB"`.
- **Industry filter**: Manufacturing, Import/Export, Logistics/Supply Chain, Oil & Energy — industries with real, active cross-border vendor/counterparty screening needs, not generic "Business Services."
- **Company headcount**: 1,001–10,000+ — a real dedicated procurement-compliance function generally exists only above a real headcount floor; below that, procurement is usually a generalist finance/ops responsibility, weaker fit.

**LinkedIn Sales Navigator — sub-segment (b), compliance-software vendors (OEM angle)**:

- **Job title**: `"Product Manager" OR "Head of Data Partnerships" OR "VP Engineering"` at companies in the KYB/KYC/sanctions-screening software space specifically.
- **Company filter**: search by company name directly for known category players (real, publicly-known compliance-software vendors in this space — a specific target-account list should be built manually from a category landscape review, not guessed here, since naming specific companies without verifying their current product scope risks a wrong or stale pitch).
- **Keyword filter**: `"KYB API" OR "sanctions screening API" OR "compliance data provider"` on the company page — a company already describing itself this way is a real, qualified OEM prospect.

**Apollo.io / ZoomInfo — both sub-segments**:

- **Job title**: same OR-lists as above, split into two separate saved searches (don't merge sub-segments (a) and (b) into one Apollo list — they need different email sequences, per `COMMERCIAL_OUTREACH_PACK.md`'s own sequence structure).
- **Company industry (NAICS)**: sub-segment (a) — Manufacturing (31–33), Merchant Wholesalers (42), Transportation & Warehousing (48–49); sub-segment (b) — Software Publishers (5112), Data Processing/Hosting (5182).
- **Technologies used**: for sub-segment (b) specifically, filter for companies already using `Refinitiv World-Check` / `Dow Jones Risk & Compliance` / `LexisNexis` — real, named incumbent sanctions-data providers; a company already paying for one of these has an active budget line for exactly this category, which is a stronger buying signal than a cold company with no current spend.

---

## Block 3: Campaign execution pipeline & onboarding playbook

### Pipeline stages

**1. Prospecting** — build the target list using the ICP filters above in Sales Navigator/Apollo.
Real, honest sizing note: none of this document's filters were run live this session (no login,
no search execution), so there's no real list-size number to report yet — the first real action in
this stage is running these searches and recording actual result counts, not assuming a number in
advance.

**2. Outreach** — send the relevant sequence from `COMMERCIAL_OUTREACH_PACK.md` (Sequence A or B
for ICP 1, the two LinkedIn messages for ICP 2, and a to-be-drafted ICP-3-specific sequence — the
current outreach pack covers ICP 1 and ICP 2 explicitly; ICP 3's two sub-segments each need their
own sequence before this stage can run for that ICP, which is a real, disclosed gap rather than a
silent one). Track: sent date, sequence variant, ICP, real reply/no-reply outcome.

**3. Demo / Integration Onboarding** — for a prospect who replies positively, the real, tested
artifact to hand them is `connect_mcp.sh` / `connect_mcp.ps1` directly (see onboarding checklist
below), not a generic sales-deck demo — the fastest credible proof for this specific product is
letting the prospect run a real tool call against their own Apify account in under five minutes,
which the onboarding scripts already do end-to-end.

**4. Closed / Active Usage** — for Starter-tier self-serve conversions, "closed" means the prospect
successfully ran a real tool call (no separate contract). For Growth/Institutional tiers per
`PRODUCT_PACKAGING_AND_PRICING.md`, "closed" means a signed retainer/contract for the service layer
described there — track separately from Starter conversions, since they're different products with
different sales cycles, not one funnel with two possible sizes.

### Campaign tracker — real, minimal-viable structure (a spreadsheet/CRM view, not a new tool to build)

| Column | Purpose |
|---|---|
| Contact name, title, company | From ICP 1/2/3 filters above |
| ICP tag | 1, 2, 3a, or 3b — keeps the different sequences/pitches from being mixed up |
| Source tool | Sales Navigator or Apollo/ZoomInfo — useful later to see which sourcing channel actually converts |
| Sequence sent | Which exact email/LinkedIn sequence from `COMMERCIAL_OUTREACH_PACK.md` |
| Sent date | — |
| Reply status | No reply / Replied-interested / Replied-not-now / Replied-no |
| Pipeline stage | Prospecting / Outreach / Demo / Closed-Starter / Closed-Growth / Closed-Institutional |
| Real usage confirmation | For Demo-stage prospects: did they actually complete a live tool call via the onboarding script? (Yes/No/Pending) — this is the single most meaningful real signal in the whole tracker, more predictive than "replied positively" |

### Onboarding checklist — reuses the real, already-validated scripts directly

1. Confirm the prospect has an Apify account and can retrieve their own API token from **Apify
   Console → Settings → Integrations** (their own token — never share or reuse Stefano's own token
   for a prospect's test, for the same reason `connect_mcp.sh`/`connect_mcp.ps1` were built to
   prompt for a fresh token every time rather than accept a pre-filled one).
2. Send them the direct link to `connect_mcp.sh` (macOS/Linux) or `connect_mcp.ps1` (Windows) in
   the repo, plus the one-line run command from `README.md`'s Quick Start for Enterprise section.
3. Confirm which client they'll test with (Claude Code or Cursor) — the script auto-detects both,
   but knowing in advance which one they actually have installed avoids a "nothing happened"
   confusion if they have neither.
4. Have them run the script and paste their own token when prompted (never share it with you —
   the whole design point of the script is that it never leaves their machine).
5. Have them ask their connected client something concrete against one real actor — e.g., for a
   compliance-ICP prospect, "check the UK Modern Slavery Statement Registry for
   [a real company name they choose themselves]" — a real, live, billed-to-their-own-account tool
   call is the actual proof of value, not a screenshot from your own test.
6. Confirm with them directly whether the call succeeded and returned real data — this is the
   "Real usage confirmation" column in the tracker above, and it's the actual conversion signal
   this whole pipeline is built to produce.
