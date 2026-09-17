# Delta Registry — Product Packaging, Pricing & Landing Page Assets

## A real constraint this whole document works around, stated up front

Apify's platform has no native mechanism for a third-party-billed "monthly subscription tier" on
top of Pay-Per-Event actors — the rental pricing model that used to support something closer to a
flat fee is being retired by Apify itself (all rental actors force-migrate to pay-per-usage by
October 1, 2026, per Apify's own documentation, verified two turns ago). Every one of the 28 actors
bills the calling account directly, per real event, at the price published on that actor's own
Apify Store listing — Stefano gets 80% of that after Apify's platform costs, and there's no code
path for him to intercept or re-tier that metering.

**What this means for "pricing tiers"**: the three tiers below are a **service-layer packaging**
around that fixed technical reality, not three different metered price points for the same API
call. Tier fees (where they exist) are for things Stefano can actually control and separately
invoice — response time, scoping help, custom actor development, a dedicated pre-scoped MCP
endpoint — never a markup or discount on Apify's own per-event billing, which stays identical for
every customer regardless of tier. Presenting this any other way would describe a billing mechanism
that doesn't exist.

## Three tiers

### Starter — self-serve, $0 from Stefano directly

- Customer connects directly to any/all of the 28 actors via the Apify Store or the public MCP
  endpoint (`MCP_INTEGRATION.md`), using their own Apify account.
- Billed by Apify, directly to the customer, at each actor's real published per-event price
  ($0.0005–$0.05/event across the fleet, exact price per actor on its own Store listing).
- No direct relationship with Stefano required, no minimum spend, no contract.
- **Real limitation to disclose honestly**: no dedicated support SLA beyond Apify's own
  Store-listing issue-response norm (the fleet's own README convention already discloses "typically
  within 48 hours" per actor — this tier doesn't change that).

### Growth — assisted, custom monthly retainer invoiced directly by Stefano (outside Apify)

- Everything in Starter, plus a direct commercial relationship: a fixed monthly retainer (amount
  to be set per Stefano's own judgment — this document proposes packaging, not a specific dollar
  figure, since that's a real business decision only he can make with real market feedback) that
  covers:
  - Priority support response (a real, contracted SLA — e.g., same-business-day — rather than the
    Starter tier's best-effort norm).
  - Help scoping exactly which of the 28 actors, and which input configuration, matches the
    customer's real watchlist/coverage need, so they aren't paying for scans that don't return
    relevant data.
  - A pre-configured, closed-scope MCP endpoint (the same `?tools=` mechanism validated this
    session, just curated to the specific subset the customer actually uses, rather than all 28) —
    genuinely reduces their integration surface, not a fake feature-gate on functionality that's
    already free in Starter.
- Apify PPE billing for actual usage still goes directly from the customer's Apify account to
  Apify, unchanged — the retainer is exclusively for the service layer above.

### Institutional Volume — custom, contract-negotiated

- Everything in Growth, plus:
  - **Custom actor development**: a 29th (or Nth) actor built against a source the customer needs
    that isn't in the current 28 — priced as a real, scoped project (development time +
    ongoing-maintenance retainer), not a subscription line item.
  - **Volume-based rebate arrangement**: for a customer whose Apify PPE spend across the fleet
    crosses a real, contractually-defined threshold, Stefano can offer a partial rebate from his
    own 80% margin — this is the one place real money can move opposite the normal direction, and
    it should be modeled explicitly against his own real margin (80% of the per-event price minus
    Apify's platform compute cost) before committing to a number, not promised speculatively here.
  - **Dedicated, branded MCP gateway** — this is exactly the "Smart Gateway" conditionally
    justified in `DISCOVERY_NEXT_LEVEL_STRATEGY.md` (condition 3: "a composite-workflow product
    gets real demand," or condition 4: "brand-owned distribution presence is a real goal") — an
    Institutional-tier customer with a genuine composite-workflow need (e.g., the "Cross-Border
    Corporate & Compliance Screen" chain already scoped in that document) is precisely the real
    demand signal that would justify building it, rather than building it speculatively first.

## Landing page assets

The site's own real architecture (confirmed by reading `components/Hero.tsx` and
`README.md` directly, not assumed) already derives every number shown from `lib/actors.ts`'s
`ACTOR_COUNT`/`DOMAINS`/`GITHUB_REPO_COUNT` constants — the copy below is written to slot into that
same pattern, not to hardcode numbers that would drift the next time an actor is added.

### Hero section — proposed addition (MCP callout), not a replacement of the existing hero

The existing hero (`Enterprise Regulatory Intelligence & Delta Engine Feeds`) is real, tested,
already-good copy — this section proposes an *addition* below the existing stat counters, not a
rewrite of a component that already works well:

```tsx
{/* Proposed addition to components/Hero.tsx, after the existing StatCounter grid */}
<div className="mt-6 flex items-center gap-2 rounded-lg border border-cyan-accent/30 bg-cyan-accent/5 px-4 py-3">
  <span className="font-mono text-xs uppercase tracking-widest text-cyan-accent">
    New
  </span>
  <span className="text-sm text-muted">
    Every actor above is now a native tool in Claude Code, Claude Desktop, and Cursor — no SDK,
    no custom integration.{' '}
    <a href="/MCP_INTEGRATION.md" className="text-cyan-accent underline underline-offset-2 hover:brightness-110">
      Connect in one command →
    </a>
  </span>
</div>
```

### Feature grid — 4 real, verifiable claims (not generic SaaS marketing bullets)

```markdown
| Claim | Real basis |
|---|---|
| **Zero-cost on unchanged runs** | Enforced at the Apify Console billing layer (`apify-default-dataset-item` charge removed fleet-wide), not just a marketing claim — verified per-actor. |
| **Native MCP integration, zero infrastructure** | Runs on Apify's own hosted `@apify/actors-mcp-server` — no server to deploy, no SDK to install. Live-tested end-to-end on 2026-09-17/18 (`LOCAL_MCP_VALIDATION_REPORT.md`): real `tools/call` against a live actor, real Apify run ID, real schema-valid data returned. |
| **Full scope-limitation disclosure per actor** | Every actor's README states what it deliberately does not cover (e.g., ADB/IDB excluded from the World Bank monitor, FDA Complete Response Letters excluded from the clinical-trials actor) — not hidden until a customer discovers a gap themselves. |
| **12 practice areas, 28 actors, one architecture** | Every number here is `{DOMAINS.length}` and `{ACTOR_COUNT}` read live from `lib/actors.ts` — this table itself will go stale the moment a new actor ships if it's ever hand-typed instead of pulled from that file. |
```

### Interactive MCP config snippet — reuses the real, tested config, not a simplified fake one

```tsx
{/* Proposed new component: components/McpQuickConnect.tsx */}
'use client'
import { useState } from 'react'
import { ACTORS } from '@/lib/actors'

const TOOLS_PARAM = ACTORS.map((a) => `stefano_seggio/${a.slug}`).join(',')
const MCP_URL = `https://mcp.apify.com/?tools=${TOOLS_PARAM}`

const CURSOR_CONFIG = `{
  "mcpServers": {
    "delta-registry": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer \${APIFY_TOKEN}" }
    }
  }
}`

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http delta-registry "${MCP_URL}" --header "Authorization: Bearer \${APIFY_TOKEN}"`

export function McpQuickConnect() {
  const [tab, setTab] = useState<'cursor' | 'claude-code'>('claude-code')
  const snippet = tab === 'cursor' ? CURSOR_CONFIG : CLAUDE_CODE_COMMAND
  return (
    <div className="rounded-lg border border-border/60 bg-titanium">
      <div className="flex gap-2 border-b border-border/60 p-2">
        <button onClick={() => setTab('claude-code')} className={tab === 'claude-code' ? 'text-cyan-accent' : 'text-muted'}>
          Claude Code
        </button>
        <button onClick={() => setTab('cursor')} className={tab === 'cursor' ? 'text-cyan-accent' : 'text-muted'}>
          Cursor
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs text-contrast/90">
        <code>{snippet}</code>
      </pre>
    </div>
  )
}
```

This deliberately derives `TOOLS_PARAM` from the live `ACTORS` array at build time — the same
"never hand-typed a second time" discipline the rest of the site already follows, applied to the
MCP URL specifically, since that URL is exactly the kind of string that goes silently stale the
moment a 29th actor ships and this component doesn't get updated by hand.

**Not yet done**: none of the three snippets above have been applied to the live site's actual
`.tsx` files — they're proposed content in this document, per the mandate's own instruction to
deliver copy and layout *into* this file, not to redeploy the site unprompted. Applying them is a
real, separate, small task (new component + one hero addition) whenever you want to greenlight it.
