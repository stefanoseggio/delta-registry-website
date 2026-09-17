# Delta Registry — Next-Level Discovery Strategy

Every claim below was checked against a primary source (Apify's own docs/changelog, the MCP
specification, vendor docs from AWS/Azure, or direct source-code/API inspection) on 2026-09-17-18.
Where a claim in the original mandate turned out to rest on a false premise, that's stated plainly
rather than worked around — three of the four blocks needed a real correction before anything
useful could be built on top of them, and pretending otherwise would just relocate the fabrication
problem instead of solving it.

## The one correction that reshapes Block 2 entirely

**MCP directories index *servers*, not configured instances of someone else's server.** Smithery,
Glama, and Cursor Directory all work the same way: you submit a GitHub repo (or, for Smithery, run
`smithery mcp publish` against a URL you control) as a distinct listing. Apify's own generic MCP
server is **already listed on Smithery** — I found the badge (`smithery.ai/server/@apify/mcp`)
directly in `apify-mcp-server`'s own README. There is no mechanism on any of these directories to
submit "`https://mcp.apify.com/?tools=stefano_seggio/...`" as your own separate listing, because
that URL is a query-string configuration of Apify's server, not a server you operate. Submitting it
as-is would either be rejected (it's not your repo) or, if accepted, would misrepresent Apify's
infrastructure as yours.

**What this actually means for distribution**: there are exactly two real paths, not the five the
mandate implies.

1. **Ride the existing rails for free.** Any agent already connected to the *generic* Apify MCP
   server (which is what's listed on Smithery/Glama, and what ships by default when someone adds
   "Apify" as an MCP source in Claude Desktop, Cursor, or any of the frameworks below) can already
   discover and call your 28 actors via the server's own `search-actors` tool, provided your actor
   metadata is strong. I confirmed two turns ago that all 28 actors already have real, complete
   descriptions, real categories, and real per-field input-schema documentation — this channel is
   already open and already working. The lever here isn't submission, it's **actor-level SEO** —
   description keyword density, category accuracy, and README quality — which was already audited
   and fixed. There is no separate directory-submission step to perform on top of that.
2. **Build and own a distinct server, if the economics justify it** — this is exactly the Smart
   Gateway question from Block 3, and it's the *only* path that produces something independently
   listable on Smithery/Glama/Cursor Directory as "Delta Registry MCP Server," because at that
   point you'd genuinely be operating your own repo and endpoint.

Everything else in this document assumes this correction; I have not written a fictional
"submission protocol" for the five ecosystems named in the mandate, because for the closed-scope
`?tools=` URL, no such protocol exists to write.

---

## Block 1 — Platform & architectural arbitrage audit

### 1.1 Apify Standby Mode — real, unused, and the actual lever (verified via [Apify's Standby docs](https://docs.apify.com/platform/actors/running/standby) and the [Actor Standby announcement](https://blog.apify.com/actor-standby-mode/))

None of the 28 actors run in Standby mode — all 28 are traditional cold-start-per-run actors. This
matters for exactly one reason, confirmed directly from `apify-mcp-server`'s own
`resolveActorToolMode()` logic (read from source two turns ago): an actor only gets treated as a
live "MCP" endpoint by the *generic* server's routing table if `actorStandby.isEnabled === true`
**and** it exposes a `webServerMcpPath`; otherwise (which is every one of your 28 today) it falls
back to `RUN` mode — the classic "start a job, poll, read the dataset" path. This still works fine
through `call-actor`, but it means every tool call to your fleet pays a cold-start tax (build
pull, container start) that a Standby actor wouldn't. Apify's own Standby docs state the ceiling
explicitly: **5 minutes maximum time-to-first-response** for a Standby actor, versus the variable,
occasionally-multi-minute cold start your `eu-ted-procurement-delta-monitor` already discloses in
its own README (up to 417 seconds observed).

**The genuinely new capability this unlocks, separate from MCP entirely**: Standby actors with a
declared `webServerMcpPath` or OpenAPI spec (`webServerSchema` in `.actor/actor.json`) get an
automatic **interactive Swagger UI** on their Console "Endpoints" tab — confirmed from Apify's own
[change-log entry](https://apify.com/change-log/interactive-openapi-for-standby-actors) — and
callers can send requests **without configuring an API token**, because the platform injects auth
automatically. This is a distinct distribution surface from MCP: a non-agentic developer (or a
tool-calling framework that speaks OpenAPI/function-calling schemas rather than MCP — plenty still
do) could integrate against a Swagger-documented REST endpoint directly, with zero code from you
beyond declaring the schema.

**Real cost of pursuing this**: converting even one actor to Standby mode means restructuring it to
run an HTTP server process instead of the current run-to-completion model — a genuine
architecture change, not a config flag, and one that would need to be justified per-actor by real
latency-sensitive demand, not spec'd wholesale across all 28 on a hunch.

### 1.2 Apify monetization models — the "hidden" one turned out to be a deadline that doesn't apply to you

Verified via [Apify's monetization docs](https://docs.apify.com/actors/publishing/monetize) and
independently corroborated by third-party trackers: Apify is **retiring the rental pricing model
entirely** — April 1, 2026 was the deadline to publish new rental actors, and **October 1, 2026**
(two weeks from today) is when all remaining rental actors get force-migrated to pay-per-usage
pricing, which the same sources describe as "almost always earns less" than the actor owner's
original rental terms. I checked this against your own fleet's real `pricingModel` field, pulled
directly from the Apify API two turns ago: **all 28 actors are already on `PAY_PER_EVENT`.** This
deadline is real, imminent, and worth knowing about in general — but it is not an opportunity or a
risk for this fleet specifically, because there is nothing here to migrate. Flagging this so it
doesn't get mistaken for a hidden lever when it's actually a non-issue for you.

**The real, verified number for ROI math in Block 4**: developers keep 80% of Pay-Per-Event revenue
after Apify deducts platform compute costs (confirmed consistently across Apify's own docs and
three independent trackers). Every revenue estimate below uses this 80% figure, not a
round-number assumption.

### 1.3 MCP protocol capabilities your setup doesn't use — verified against the live spec, not assumed

Checked the [MCP sampling specification](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling)
directly. `sampling/createMessage` is real: it lets a **server** ask the **calling client's own
LLM** to generate a completion, useful for a server that wants to do lightweight reasoning without
holding its own model API key. I then re-checked `apify-mcp-server`'s own README (already read in
full two turns ago): *"The server advertises the `prompts` capability, but no prompts are currently
registered — `prompts/list` returns an empty list."* Apify's hosted server explicitly does not
implement custom prompts today, and there's no equivalent statement anywhere in its docs claiming
sampling support either. **This means sampling isn't something you can "turn on" for your 28
actors through the existing hosted infrastructure** — it would require you to operate your own MCP
server (again, the Smart Gateway question), at which point you could register real prompts (e.g., a
canned "audit this entity across the whole fleet" prompt template) and potentially use sampling to
have the calling agent's own LLM pre-classify a jurisdiction before your server picks a route. This
is a real, specific feature gap — but it's gated behind the same build-vs-don't-build decision as
everything else non-trivial in this document, not a separate quick win.

### 1.4 Data productization gaps — what's real across the 28 actors, checked individually, not asserted in bulk

- **Cross-jurisdictional webhooks**: each actor that supports webhooks (confirmed: the 4 newest,
  via `webhookUrl`/`slackWebhookUrl`/`teamsWebhookUrl` input fields) fires independently, per actor,
  per run. There is no unified "tell me about any sanctions/compliance event across all 28 actors"
  webhook today — building one is real, scoped work (a thin aggregator subscribing to N actors'
  webhook outputs and re-emitting a single normalized stream), not a config change.
- **Historical diff/delta state storage**: already real and already built — every actor's delta
  engine persists fingerprint state in a named Key-Value Store across runs (this is the core
  architecture of the entire fleet, documented per-actor in each `AGENTS.md`). What's *not* built:
  a **queryable history** of past diffs (e.g., "show me every status change this entity has had in
  the last year") — today's KV stores hold only the latest fingerprint for change detection, not an
  append-only log. Building that would mean adding a dataset-append step alongside the existing
  fingerprint-compare step in each actor's delta engine — real, moderate, per-actor work.
- **Automated schema-drift alerts**: no actor currently monitors whether its own upstream source
  (TED's API, KIPRIS Plus, Dubai Pulse, etc.) has changed its response shape out from under the
  actor's parser. This is a real, unbuilt safety net — a lightweight canary run comparing a
  sampled response's keys against the actor's own expected schema, alerting before a silent
  parsing failure ships bad data.
- **Normalized cross-actor output model**: partially real already — every actor uses the shared
  Unified Master Schema (UMS) envelope pattern (`event_type`, fingerprint fields, `record_id`)
  documented in `AGENTS.md` across the fleet. What's missing is a single published JSON Schema
  file describing the *shared* envelope fields once, referenced by all 28 actors' own
  `output_schema.json`, instead of each actor declaring its own envelope inline. This is real,
  low-risk, high-leverage documentation/tooling work — not a new capability, a de-duplication of an
  existing one.

---

## Block 2 — Distribution channels, corrected

### 2.1 Framework-native MCP support — already solved, zero work required (verified against each project's own docs)

- **LangChain / LangGraph**: `langchain-mcp-adapters` (real package, PyPI and npm, maintained by
  `langchain-ai`) converts any MCP server's tools directly into LangChain-compatible tools and
  works with LangGraph agents out of the box. Point it at
  `https://mcp.apify.com/?tools=stefano_seggio/...` (the exact URL from `MCP_INTEGRATION.md`) with
  a bearer-token header and every one of your 28 tools is immediately usable — no adapter code to
  write, because the adapter already exists and is generic.
- **CrewAI**: native `mcps` field on an agent definition, supporting both stdio and remote
  (Server-Sent Events / streamable HTTP) MCP servers directly in the agent DSL. Same story — your
  existing URL is directly consumable.
- **LlamaIndex**: auto-converts MCP tools to `FunctionTool` objects for use in a LlamaIndex Agent.
  Same story again.

**The honest conclusion**: there is no "distribution channel" work to do here beyond what's already
shipped in `MCP_INTEGRATION.md`. Every framework named in the mandate already treats a
Bearer-token-authenticated remote MCP URL as a first-class citizen. The only way to *increase*
uptake through these channels is demand-side (get developers using these frameworks to actually
choose your fleet over a competitor's), not supply-side integration work, because the supply-side
integration is a solved problem the frameworks solved for you.

### 2.2 Enterprise platforms — real, current, and genuinely worth setting up (unlike 2.1, these are new work)

**Azure AI Foundry Agent Service** — confirmed as a first-class MCP client (Microsoft's own
framing) as of the 2026-08-26-dated docs page I fetched directly. Exact, verified tool definition,
copy-pasted from Microsoft's own current documentation, not paraphrased:

```json
{
  "type": "mcp",
  "server_label": "delta_registry",
  "server_url": "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,...(all 28, per MCP_INTEGRATION.md Block 1.1)",
  "require_approval": "never",
  "project_connection_id": "delta-registry-mcp-conn"
}
```

The `project_connection_id` is required for an authenticated remote server and is created
separately (real, verified CLI syntax from Microsoft's own docs):

```bash
azd ai connection create delta-registry-mcp-conn \
  --kind remote-tool \
  --target "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,..." \
  --auth-type custom-keys \
  --custom-key "Authorization=Bearer ${APIFY_TOKEN}"
```

`require_approval` can be set to `"never"` (auto-execute), `"always"` (human-in-the-loop for every
call — sensible default for anything billed per-event against a real Apify account), or a
per-tool-name allow/deny object if some of the 28 should require approval and others shouldn't
(e.g., auto-approve the free `check_global_page_metadata` tool, require approval for the $0.05/call
`check_us_sec_enforcement` tool). This granularity is real and directly maps onto your fleet's real
pricing spread.

**Amazon Bedrock AgentCore Gateway** — confirmed as supporting external MCP servers as "targets,"
connected via the `SynchronizeGatewayTargets` API, with two real authentication paths: OAuth
(two-legged client-credentials, three-legged authorization-code, or on-behalf-of token exchange,
all configured through Bedrock AgentCore Identity) or IAM SigV4 request-signing using the gateway's
own service role. This is architecturally different from Azure's model — AgentCore Gateway sits
*between* the MCP server and the agent, centralizing credential management and observability,
rather than the agent connecting directly. For a Bearer-token-authenticated server like
`mcp.apify.com`, the OAuth two-legged (client-credentials) path is the closest fit, since AWS's own
IAM SigV4 signing doesn't map onto Apify's plain-Bearer auth model — worth a direct proof-of-concept
before committing engineering time here, since I could not find a documented example of Bedrock
AgentCore Gateway connecting specifically to a plain-Bearer-token external server (every example
found used OAuth-native services like Salesforce or a first-party AWS target); this is flagged as
**needs live verification**, not confirmed working, unlike the Azure path above which I traced
through a complete, literal, copy-pasteable example.

### 2.3 Autonomous agent B2B payment rails — already real infrastructure, already documented in `MCP_INTEGRATION.md`

AGI (prepaid token via x402/MPP), direct x402 (USDC on Base, per-request via the `mcpc` client),
and Skyfire (prepaid PAY tokens passed as a tool parameter) are all real, already-live features of
`mcp.apify.com` — verified directly from `apify-mcp-server`'s own README in the prior turn's
research, re-confirmed here. **There is no additional setup required on your end to accept these
payment rails** — they're a property of the hosted server, not something scoped per-actor or
per-developer-account. An autonomous agent with no Apify account can already pay to call any of
your 28 actors today via any of these three rails. The only lever available to you here is making
sure your fleet is discoverable to agents that specifically use these payment-first flows — which
loops back to the same actor-metadata-quality lever from section 2.1, not a new integration.

---

## Block 3 — Packaged data products & the Smart Gateway decision

### 3.1 Three composite workflow primitives (real actor chains, using only actors that already exist)

**"Cross-Border Corporate & Compliance Screen"** — chains `check_singapore_corporate_registry`,
`check_uae_corporate_registry`, `check_uk_modern_slavery_registry`, and
`check_us_sec_enforcement` for a single entity name across four independent registries covering
three continents. Real justification for packaging this as one product rather than four separate
calls: a compliance analyst's actual workflow is "check this counterparty everywhere we have
coverage," not "call the Singapore tool, then remember to also call the UAE tool." The chain adds
real value (one report, four jurisdictions) without requiring any new data collection — pure
orchestration value.

**"Government Procurement Radar (Americas + Europe)"** — chains the seven Argentine provincial
tender actors, `check_us_florida_procurement`, and `check_eu_procurement_ted` behind one
keyword/entity query, returning a unified cross-border tender-opportunity feed. Real justification:
a bidder tracking opportunities across multiple jurisdictions today has to run eight separate
queries and manually de-duplicate/normalize the results; a chained wrapper doing that
normalization once is a genuine time-saving product, not a cosmetic bundle.

**"Sanctions & Sovereign Risk Monitor"** — chains `check_global_maritime_sanctions`,
`check_us_sec_enforcement`, and `check_brazil_sovereign_debt` for a portfolio-risk use case (a fund
or bank tracking both entity-level sanctions exposure and macro sovereign-debt-market signals in
one feed). This is the most speculative of the three — sanctions screening and sovereign-debt
auction tracking serve genuinely different buyer personas (compliance vs. fixed-income desks), and
I want to be honest that "chain them because they're both regulatory" is weaker justification than
the other two, which chain tools solving the *same underlying workflow* for one buyer. Worth
validating demand before building, not assuming it from the pattern-match to the other two ideas.

### 3.2 The Smart Gateway — precise conditions under which building it is justified

Revisiting the router sketch already shipped in `MCP_INTEGRATION.md` Block 4: that code is real and
correct, but building and deploying it is **not justified today**, for a reason I can state
precisely rather than vaguely: the 28-tool closed-scope hosted configuration already works, costs
zero engineering time, and is already reachable from every framework in section 2.1. A custom
gateway only pays for itself once at least one of these becomes true, each independently
verifiable rather than assumed:

1. **Real evidence of tool-misrouting** — an LLM agent, given the 28 real tool descriptions,
   actually picks the wrong jurisdiction's tool often enough to matter. This is measurable (log
   real tool-call selections against real user intents) and should be measured before the router
   is built, not assumed from first principles.
2. **A genuine need for MCP capabilities the hosted server doesn't expose** — custom prompts,
   sampling, or resources, per section 1.3 above. Right now nothing in this fleet's actual usage
   demands these; building a gateway purely to unlock unused capability is solving a problem you
   don't have yet.
3. **A composite-workflow product from 3.1 gets real demand** — at that point the gateway isn't a
   router anymore, it's the actual product (the entity-screening or procurement-radar endpoint),
   and the engineering cost is justified by the product itself, not by MCP-routing purity.
4. **You want independent Smithery/Glama/Cursor Directory listing** — per the Block-2 correction,
   this is only possible once you operate a distinct server. If brand-owned distribution presence
   on these directories is a real goal (not just "it would be nice"), that alone justifies the
   build regardless of 1–3.

None of these four conditions are met today, based on everything verified in this pass. The
correct action right now is instrumenting usage of the existing hosted configuration (which
`mcp.apify.com` already logs via its telemetry, per the README) to get real data on condition 1,
rather than building speculatively.

---

## Block 4 — Execution matrix

Effort estimates are for a single experienced developer already familiar with this codebase (i.e.,
calibrated to how this session's own work has gone, not a generic industry estimate). Revenue/
volume impact is stated as a direction and rough order of magnitude where I have a real basis for
one (the 80/20 PPE split, real per-event pricing already in `lib/actors.ts`), and explicitly marked
**unverifiable** where a number would just be invented to look precise — per this mandate's own
"zero hallucinated" requirement, a fake "47x" is worse than an honest "no basis for a number yet."

| Opportunity | Effort | Revenue/Volume Impact | Priority | Prerequisite / Target |
|---|---|---|---|---|
| Instrument real MCP tool-call telemetry from the existing 28-tool hosted config | 2–4 hours | Enables every other decision in this table to be evidence-based instead of guessed | **P0** | `mcp.apify.com` dashboard / telemetry opt-in, no code |
| Azure AI Foundry connection + toolbox setup (section 2.2) | 4–6 hours | Opens one real enterprise channel with a verified, complete config; volume impact **unverifiable** until real Azure customers are targeted | **P1** | `azd ai connection create` against your real Apify token, real Azure Foundry project |
| Bedrock AgentCore Gateway proof-of-concept (OAuth client-credentials path) | 1–2 days, because the auth-mapping is unverified and needs real trial-and-error | **Unverifiable** — no comparable example found to size this against | **P2** | AWS account with Bedrock AgentCore access; validate `SynchronizeGatewayTargets` against a plain-Bearer target before committing further time |
| Unified cross-actor webhook aggregator (section 1.4) | 3–5 days for a real, tested implementation across all 28 | Real but **unverifiable** magnitude — depends entirely on whether customers actually want one alert stream vs. per-actor webhooks, which hasn't been asked | **P1** | New thin service (not an Apify actor necessarily) subscribing to each actor's `webhookUrl` output |
| Shared UMS envelope JSON Schema, referenced by all 28 `output_schema.json` files | 1 day | Zero direct revenue; real reduction in future per-actor maintenance drift | **P1** | `lib/types.ts`-equivalent schema file + 28 small edits, one PR |
| Schema-drift canary checks per actor | 2–3 hours per actor, 28 actors = 1–1.5 weeks total if done for the whole fleet | Real risk-reduction (catches silent data-quality failures before customers do); no direct revenue | **P2** | Per-actor cron/canary run comparing a sampled response's keys against expected schema |
| "Cross-Border Corporate & Compliance Screen" composite product (section 3.1) | 3–5 days for a real, tested implementation | **Unverifiable** without prior demand signal — build only after P0's telemetry or direct customer interest confirms appetite | **P2** | New wrapper (Smart Gateway conditions 3 from section 3.2) |
| "Government Procurement Radar" composite product (section 3.1) | 3–5 days | Same caveat as above | **P2** | Same |
| "Sanctions & Sovereign Risk Monitor" composite product (section 3.1) | 3–5 days | Weakest-justified of the three (see 3.1) — deprioritize below the other two composites until demand is confirmed | **P2** (soft — closer to P3 given weaker rationale) | Same |
| Standby-mode conversion for any single actor (section 1.1) | 2–4 days per actor for a genuine architecture change, not a flag flip | Real latency improvement for that actor only; no fleet-wide revenue basis | **P2**, actor-specific, not fleet-wide | Pick the actor with the worst real observed cold-start (currently `eu-ted-procurement-delta-monitor` at up to 417s) as the pilot, not an arbitrary one |
| Build the Smart Gateway wrapper Actor | 1–2 weeks for a real, tested, deployed version | Directly enables Smithery/Glama/Cursor Directory listing (section 3.2, condition 4) if that's a real goal; otherwise **do not build** per the four gating conditions | **P0 if any of the four section-3.2 conditions are independently confirmed true; otherwise not scheduled at all** | Confirm at least one condition from section 3.2 before scoping this, not before |

**What's deliberately absent from this table**: a line item for "submit to Smithery/Glama/Cursor
Directory/LangChain Hub" as a standalone task, because — per the correction at the top of this
document — there is nothing to submit until the Smart Gateway exists. Listing it as a P1 task
anyway, the way the original mandate framed it, would mean scheduling work against a target that
doesn't exist yet.
