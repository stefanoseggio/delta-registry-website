# GTM Outreach Campaign Launch

## Corrections made before executing this mandate

**"Zero external usage empirically confirmed" is not what the prior audit found.**
`ARGENTINA_ACTORS_MONETIZATION_AUDIT.md` (previous turn) explicitly left this unresolved: every
*visible* run traces to Stefano's account, but the actor-level `stats.totalUsers` counters show
activity this session couldn't attribute with confidence (most plausibly explained by the
account's own 7-day data-retention limit on the Free plan hiding older self-testing history, not
confirmed real customers, and not ruled out either). Treating "zero usage" as settled going into a
sales campaign risks framing outreach copy around a claim that isn't verified. The copy below
makes no claim about current usage levels either way — it's written to work regardless of how that
resolves.

**`{{Company}}` / `{{specific registry}}` stay as live merge fields, not hardcoded examples.**
These interpolate real per-contact data at send time in Apollo/Instantly/Lemlist. Replacing them
with one example company would mean every recipient receives an email claiming they work
somewhere they don't — a functional bug, not personalization. Real, concrete fill-in guidance is
provided separately in Block 2 instead, without corrupting the template.

**No real prospect research was performed.** This session has no CRM, Sales Navigator, Apollo, or
ZoomInfo access. Any company named below as a "target example" is a well-known, publicly obvious
category reference (the same pattern already used in this fleet's own README competitor
comparisons — Kyckr, CRIF, Moody's Orbis, Bloomberg) to illustrate *fit*, never presented as a
vetted lead with a real contact identified. Building an actual prospect list requires a real
prospecting tool and real per-contact research neither this session nor a mandate can substitute
for.

---

## Block 1 — Security rotation & credential check

### Proxy password rotation — real steps, Console-only

Verified this session: there is no `/v2` API endpoint for creating, listing, or rotating the
account's Proxy password (`apify api --list-endpoints -s proxy` / `-s password` both return no
matches) — the same real constraint already established for API tokens earlier this session.
Rotation is Console-UI-only:

1. Go to `console.apify.com` → **Proxy** (left sidebar) → **HTTP & SOCKS5 proxy** tab.
2. Locate the **Password** field and its regenerate/reset control.
3. Regenerate it. The new password becomes active immediately; the old one stops authenticating
   proxy connections.
4. If anything in this account's actors or local tooling references the proxy password directly
   (most don't — proxy usage is typically handled via Apify's `proxyConfiguration` input object,
   which references a proxy *group*, not the raw password, so this is a low-blast-radius rotation
   unlike the API token was), update it there.

This assistant has not visually walked through steps 1-3 this session — the browser used here
isn't logged into Apify Console, and logging in (Google/GitHub/email OAuth) is not an action this
assistant will take regardless of mandate wording, the same boundary already stated in the prior
turn. The steps above are accurate based on Apify's documented proxy settings location, not
click-by-click verified live.

**A real, safe way to confirm the rotation worked without printing the new password**: after
regenerating, run a proxy connectivity test with the new credentials piped directly from the OS
clipboard into a test command (the same clipboard-bridging technique already used for the earlier
API token rotation) — never typed or printed into any visible output.

### OS keyring / local environment — verified now, no plaintext exposed

| Check | Result |
|---|---|
| Apify CLI keyring token vs. Claude Code's `.claude.json` MCP config token | **Identical** (verified via direct string comparison in a script; only a 6-character suffix, `...3xoHb9`, was ever printed) |
| Token length | 46 characters, consistent with a real Apify token in both locations |
| Account-wide token count/list | **Not verifiable this session** — no `GET users/me/api-tokens`-equivalent endpoint exists (confirmed by testing it; same Console-only constraint as token creation, established earlier this session). Confirming no unexpected third token has been added requires checking Console → Settings → Integrations directly. |

No credential value was printed in producing this section.

---

## Block 2 — Campaign templates (merge fields intact) + real fill-in guidance

### ICP 1 — LegalTech & Regulatory Compliance Platforms (US/EU/LATAM procurement feeds)

Real copy, reused from `COMMERCIAL_OUTREACH_PACK.md` Block 1 and Block 4 Sub-Track B, combined
because this ICP definition spans both the compliance-buyer and RegTech-vendor angle:

**Sequence 1A (Day 0)** — Subject: `How are you tracking [specific register] changes right now?`
> Hi {{FirstName}}, quick question: when {{specific registry}} happens, how does your team find out? Most compliance teams are either manually re-checking a government portal on a schedule, or paying for a broad compliance-data platform bundling in a hundred sources they don't use to get the one they need. I run Delta Registry — 28 narrow, single-purpose monitors, each wrapping exactly one public regulatory or procurement register across the US, EU, and LATAM (Florida state procurement, EU TED, 9 Argentine provincial/national portals, and 19 others). Each is delta-tracked: billed only when a record is genuinely new or changed — $0.00 on an unchanged run, every time. Worth 15 minutes to see if one of the 28 already covers something you're checking by hand? {{Signature}}

**Sequence 1B (Day 5, if no reply)** — Subject: `A wholesale data layer, not a competing product`
> Hi {{FirstName}}, reaching out because {{Company}} builds {{their real product category}}, and 28 narrow, single-source monitors might be a cheaper, faster wholesale layer under what you already ship rather than something competing with it. Real, published Pay-Per-Event pricing, $0.0005–$0.05/event depending on source — no negotiation required to see the real number. If you're maintaining your own scrapers against any of these sources, the honest comparison is your fully-loaded maintenance cost against the per-event price. Every actor's own docs disclose what it explicitly doesn't cover. Worth a technical call? {{Signature}}

### ICP 2 — Quant & Emerging-Market Hedge Funds (macro + tender event monitoring)

Real copy, reused from `COMMERCIAL_OUTREACH_PACK.md` Block 2, LinkedIn-native (not CSV-importable
into an email tool — send directly via LinkedIn):

**Message 1**
> Hi {{FirstName}} — saw you're building data infra for {{fund/team}}. I run a small pay-per-event monitor on Brazil's Tesouro Nacional domestic bond auctions (LTN/LFT/NTN-B/NTN-F) — basis-point-precision rate tracking and coverage-ratio anomaly detection, sourced directly from Tesouro Transparente. One of 28 actors in a broader regulatory/financial-data fleet, callable natively as an MCP tool if your stack talks to Claude/Cursor/LangGraph. Worth a look if EM sovereign debt is in scope for your desk?

**Message 2**
> Hi {{FirstName}} — following up in case this is more relevant to compliance/risk than quant: the same fleet includes a schedule-driven, delta-tracked SEC enforcement/litigation feed with automatic EDGAR CIK entity resolution — useful for cross-referencing counterparty enforcement risk against holdings. Both actors (and the other 26) are priced strictly per genuinely-new-or-changed event, no subscription.

**Real, honest note on "tender event monitoring" for this ICP**: government procurement/tender
volume as a macro signal is a plausible framing, not a validated one — no customer has confirmed
this use case this session. If pursuing it, frame it as a hypothesis to test in a discovery call,
not a proven capability.

### ICP 3 — Enterprise OEMs & Supply Chain Intelligence (regulatory updates & recalls)

New copy, grounded in real, just-verified pricing (not reused verbatim from the existing pack,
since this specific ICP3 framing — recalls/supply-chain risk — wasn't the original ICP3's angle,
which was sanctions/procurement-platform-focused):

**Sequence 3A (Day 0)** — Subject: `How does {{Company}} find out about a supplier's drug/patent/debarment risk?`
> Hi {{FirstName}}, a specific question: if a supplier or component vendor in {{Company}}'s chain gets an FDA/EMA drug safety recall, a patent enforcement action, or a World Bank debarment, how does your team find out today? Three of my 28 regulatory monitors cover exactly this: FDA openFDA + EMA DHPC drug recall deltas ($0.001/record), USPTO PTAB + EPO Opposition patent dispute tracking ($0.002/record), and World Bank procurement notices plus debarred-firm records ($0.001–$0.003/record) — each delta-tracked, so you're billed only for genuinely new or changed events, not a flat feed of noise. Worth 15 minutes to see if any of the 28 maps to a real gap in your current supplier-risk monitoring? {{Signature}}

**Sequence 3B (Day 5, if no reply)** — Subject: `The exact schema, if useful without a call`
> Hi {{FirstName}}, in case a call isn't the next step yet: every actor ships a shared UMS output envelope (`event_type`, `record_id`, separate content/status fingerprints), so integrating one doesn't mean bespoke parsing per source. Full schemas and real pricing are public on each actor's Store listing, and the whole fleet is callable natively via MCP — one connection URL, no custom API client: https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md. Setup script (prompts for your own Apify token, never leaves your machine): https://github.com/stefanoseggio/delta-registry-website/blob/main/connect_mcp.sh (macOS/Linux) or `.../connect_mcp.ps1` (Windows). {{Signature}}

### Real fill-in guidance (not hardcoded into the templates above)

| Field | ICP 1 example pattern | ICP 2 example pattern | ICP 3 example pattern |
|---|---|---|---|
| `{{specific registry}}` | "a vendor on your watchlist gets a new EU TED procurement flag" or "a company drops off Florida's active-vendor list" | N/A (LinkedIn copy doesn't use this field) | "a supplier's product hits an FDA Class I recall" |
| `{{Company}}` real category examples (illustrative only, not vetted leads) | A firm like Thomson Reuters/LexisNexis-scale LegalTech, or a mid-market KYB/compliance SaaS vendor | N/A | A firm like a pharma CMO/CDMO, or a hardware OEM with a global supplier base |
| `{{specific actor}}` (ICP1 follow-up) | Whichever of the 28 actually matches the prospect's real, stated coverage gap — determined in the reply, not guessed in advance | — | actor-22 (drug recalls), actor-21 (patent disputes), or actor-20 (MDB debarment), whichever matches the prospect's real supply-chain exposure |

---

## Block 3 — Import-ready files & verified URLs

Real CSV files generated alongside this document (Step/Day/Subject/Body columns, standard
Apollo/Instantly/Lemlist bulk-import shape):

- [`gtm_campaign_icp1_legaltech_compliance.csv`](gtm_campaign_icp1_legaltech_compliance.csv)
- [`gtm_campaign_icp3_oem_supplychain.csv`](gtm_campaign_icp3_oem_supplychain.csv)

ICP 2 is LinkedIn-native copy (Block 2 above) — not CSV-importable into an email-sequencing tool;
send directly via LinkedIn or a LinkedIn-specific outreach tool.

**Verified, live URLs embedded in every sequence above** (re-confirmed public this session):
- MCP setup guide: `https://github.com/stefanoseggio/delta-registry-website/blob/main/MCP_INTEGRATION.md`
- Connect scripts: `https://github.com/stefanoseggio/delta-registry-website/blob/main/connect_mcp.sh` / `.../connect_mcp.ps1`
- Store catalog: `https://apify.com/stefano_seggio`
