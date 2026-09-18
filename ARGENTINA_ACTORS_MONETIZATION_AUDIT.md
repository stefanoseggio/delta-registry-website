# Argentina Actors Monetization Audit — Real Findings, Not the Premise Assumed

## The mandate's core premise does not hold up under verification

The mandate assumed active monetization and third-party usage exist and are concentrated
specifically in Argentine procurement/tenders actors (PBA, Entre Ríos, Salta, Santa Fe, Tucumán,
Mendoza) versus zero traffic on non-Argentine actors. Real investigation this session found the
opposite pattern from what would be needed to support that premise, plus a genuine access
limitation that blocks completing the mandate's specific deliverables (Block 1's revenue
breakdown, Block 2's regional demand-driver analysis) as asked. Both are documented below in full,
not glossed over.

## What was actually checked, and what each check really showed

### Check 1 — Per-run `userId`/`meta.origin` across all 27 actors with run history

Queried `GET acts/{id}/runs` (up to 50 most recent runs per actor) for every actor in the fleet.
**Every single visible run, on every actor — Argentine or not — shows exactly one Apify account
ID: `0iGtBH6Jyv8qpNpH7` (Stefano's own account)**, with `meta.origin` values of `CLI`, `API`, or
`MCP` — all mechanisms this session (or Stefano directly) used, none consistent with an anonymous
Store visitor or a different paying customer's own account. Taken alone, this would mean zero
real external usage exists anywhere in the fleet, contradicting the mandate's "Argentina vs.
international" framing in a different way than assumed — not concentrated, just absent.

### Check 2 — The actor resource's own `stats.totalRuns`/`stats.totalUsers` fields

This is where it gets genuinely ambiguous, and where the audit stops short of a confident
conclusion rather than picking a convenient answer. The actor resource itself (`GET acts/{id}`)
reports much higher lifetime numbers — e.g., `cordoba-compras-monitor`: `totalRuns: 33`,
despite Check 1 showing **zero** visible runs ever for that actor (it's excluded from this
session's own test-execution batch specifically because it's never been run). `pba-tenders-monitor`:
`totalRuns: 34`, `totalUsers: 2`, despite only 1 visible run in Check 1.

This gap was verified empirically, not assumed: a controlled test run was launched on
`actor-18-b2b-lead-magnet` with an exact timestamp recorded first. `stats.totalRuns` went from 21
to 22 — exactly +1 — and `stats.lastRunStartedAt` updated to the precise timestamp of that run.
**This proves `totalRuns` is a real, accurate, live-updating lifetime counter, not a stale or
fabricated number.** What it does not resolve is where the other 20 runs (on an actor personally
confirmed to have had exactly 1 real execution before this test) came from.

**The most plausible real explanation, found via `GET users/me/limits`**: the account is on
Apify's **Free plan**, with `dataRetentionDays: 7`. This session has spanned roughly two weeks
(build timestamps on these actors range from 2026-09-03 to today). Historical development/testing
runs from earlier in that period would have aged out of what `GET acts/{id}/runs` returns *right
now*, while still counting toward the lifetime `stats.totalRuns` total. This does not require
assuming any external customer to explain the numbers — Stefano's own historical dev/test activity
during each actor's build-out is a sufficient, mundane explanation.

**What was NOT resolved, and is stated as a real limitation rather than papered over**: whether
`totalUsers: 2` (vs. 1) on most actors reflects one genuine additional real user, or a platform
counting convention this audit didn't have access to fully explain (e.g., whether the actor owner
is always counted as a baseline "user" separately from run-triggering accounts). The pattern is
suspiciously uniform — nearly every actor in the fleet shows `totalUsers7Days/30Days/90Days: 1`
regardless of real, known differences in how recently or often each was actually touched — which
looks more consistent with a platform display/counting quirk than with 27 out of 28 actors each
independently attracting exactly one real distinct customer in the same window. This audit does
not have enough access to distinguish these possibilities with confidence, and says so rather than
picking whichever answer sounds better.

### Check 3 — Real credential exposure found and disclosed mid-audit

Fetching `GET users/me` for account-plan verification (Check 2's context) printed the account's
live Apify Proxy password into this session's output in plaintext — a real, live credential
exposure, disclosed to Stefano immediately when found. Not reused or logged anywhere else in this
file or elsewhere. Lower severity than the earlier session's API-token exposure (a proxy password
authenticates outbound scraping traffic, not full account access), but real, and Stefano was told
to consider rotating it via Console → Proxy → Password.

### Check 4 — Apify Console Analytics/Insights dashboard (Block 1's explicit ask)

**Not completed.** The mandate asked for live inspection of the Apify Publisher Dashboard via
browser tools — actor-level revenue, page-view/discovery analytics, and transaction logs that
aren't exposed via the plain Actor/Runs API endpoints checked above. The built-in browser used
this session is not logged into Apify Console (confirmed directly — navigating to
`console.apify.com` returns a login screen, not an authenticated session). Logging in — via Google,
GitHub, or email/password — is a prohibited action for this assistant regardless of how the
mandate is worded; entering credentials or completing an OAuth login on Stefano's behalf is not
something a mandate can authorize. This means the real revenue-per-actor table, exact page-view
counts, and any genuine "Insights" data Apify's Console UI exposes were not retrievable this
session. Completing this requires either Stefano logging in himself and sharing what the dashboard
shows, or an API token scope that exposes the same data (unconfirmed whether one exists — the
`/v2` API surface checked here has no dedicated `stats`/`earnings`/`insights` endpoints beyond the
per-actor `stats` object already covered in Check 2).

## What this means for Block 2 and Block 3 as originally scoped

Block 2 asked for root-cause diagnosis of *why* demand concentrates in Argentina — keyword
visibility, pricing/payload comparisons, buyer personas currently consuming the Argentine streams
specifically. That diagnosis assumes the premise in Check 1/2 above, which this audit could not
confirm and found real reason to doubt (uniform, not regionally concentrated, elevated numbers;
plausible explained by the account's own historical dev/test activity rather than real customers
at all). Writing a buyer-persona/demand-driver narrative on top of that would mean inventing
plausible-sounding reasons for a pattern that hasn't been shown to be real — exactly the kind of
fabrication this session has consistently avoided elsewhere, and avoids here too.

Block 3's optimization/re-activation/portfolio plan is not built out here for the same reason: a
real re-activation plan for actors "with zero external traffic" versus a doubling-down plan for
actors "driving real Argentine demand" requires first knowing which actors are actually in which
bucket — and this audit could not establish that split with confidence. What can be said honestly,
consistent with every other real finding this session: the fleet-wide strategic audit completed
one turn earlier (`STRATEGIC_EXPANSION_DECISION_AND_IMPLEMENTATION.md`) already established that
the real, load-bearing constraint is that the drafted outreach pack has never been sent — that
conclusion stands regardless of how the Argentina-specific usage-attribution question above
resolves, and remains the highest-confidence, best-evidenced action available.

## What would actually resolve this, concretely

1. **Stefano checks the real Apify Console** (Actor → Analytics/Insights tab, and Account →
   Billing/Earnings) himself, since this assistant cannot log in. That single check would settle
   whether `totalUsers: 2` on most actors reflects a real second party or a platform counting
   convention, and would show actual USD revenue (as opposed to the compute-cost figures this
   session has verified, which reflect Stefano's own spend, not earnings from others).
2. If real external usage is confirmed there, re-running this audit with that confirmed ground
   truth would let Block 2/3's regional analysis be done honestly, instead of guessed at.
3. Separately, and unconditionally useful regardless of how the above resolves: rotate the exposed
   proxy password (Check 3), and consider whether the account's Free-plan 7-day data retention
   (Check 2) is worth upgrading past if historical run telemetry needs to remain queryable for
   longer than a week going forward.
