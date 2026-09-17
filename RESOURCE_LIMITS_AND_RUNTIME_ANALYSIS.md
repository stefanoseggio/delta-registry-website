# Fleet Resource Limits & Runtime Analysis

Real data only. Every number below traces to a live Apify API call made against
`stefano_seggio`'s account on 2026-09-17/18 — either a run's own reported `stats.runTimeSecs` /
`stats.memMaxBytes`, or the Actor resource's own `defaultRunOptions`. Nothing here is a modeled,
simulated, or estimated latency figure dressed up as a measurement — where no real run exists for
an actor, that is stated plainly and no number is invented to fill the gap.

## Three corrections to the mandate's assumptions, made before writing anything

### 1. The "7 regulatory domains" don't exist — the real taxonomy has 12

The mandate's Block 1 groups the fleet into "Maritime Sanctions, Banking/AML, Trade Enforcement,
Corporate Registries, Aviation/Transport, Energy/Commodities, Cybersecurity/Tech." Checked against
the live, deployed `domain` field on every actor (`lib/actors.ts`, this repo's own single source of
truth): the real taxonomy has **12 domains**, and none of the mandate's seven match except
"Corporate Registries" (coincidentally real). There is no aviation/transport, energy/commodities, or
cybersecurity/tech actor anywhere in this 28-actor fleet. The real domains, with actor counts:

| Real domain | Actors |
|---|---|
| Government Registers & Procurement | 13 |
| Patent & IP Enforcement | 2 |
| Pharma Safety & Clinical Trials | 2 |
| Corporate Registries | 3 |
| B2B Data Enrichment | 1 |
| Sanctions & Trade Compliance | 1 |
| Development Finance Procurement | 1 |
| SEO & Data Pipelines | 1 |
| Securities & Financial Enforcement | 1 |
| AI Crawler & Content Governance | 1 |
| Digital Archives & Publishing | 1 |
| Financial Markets & Sovereign Debt | 1 |

Block 2 below is grouped by these real 12 domains, not the mandate's fabricated 7.

### 2. There is no "Max Concurrency Limit" field to set — checked at the platform level and per-actor

Fetched the complete Actor API resource (`GET /v2/actors/{id}`, full response, not just
`defaultRunOptions`) for all 28 actors and searched every key and value for anything
concurrency-related. Result: **`defaultRunOptions` contains exactly three fields —
`build`, `timeoutSecs`, `memoryMbytes` — on every one of the 28 actors, with no exceptions.** There
is no platform-level concurrency control on an Apify Actor resource at all; Apify actors run one
container per triggered run, and "concurrency" only exists as a concept an actor's own code
chooses to implement internally (e.g., how many outbound HTTP requests it fires in parallel during
one run).

Five of the 28 actors *do* expose a real, customer-facing concurrency-style control — but as an
**input schema field the customer sets per run**, not a platform default an operator can bulk-apply:

| Actor | Input field | Default | Max |
|---|---|---|---|
| `ai-crawler-content-signal-permission-monitor` | `concurrency` | 15 | 50 |
| `australia-grantconnect-monitor` | `maxConcurrency` | 5 | 10 |
| `florida-tenders-monitor` | `maxConcurrency` | 5 | 10 |
| `santafe-compras-monitor` | `maxConcurrency` | 5 | 10 |
| `uk-hse-enforcement-monitor` | `maxConcurrency` | 5 | 10 |

**What this means for Block 3**: the apply script below only ever touches `timeoutSecs` and
`memoryMbytes` via `defaultRunOptions`. It does not attempt to "apply" a concurrency limit — there
is no API field for that to write to. The table's "Concurrency Control" column documents which 5
actors have one, purely as an informational note for anyone tuning that actor's *input*, not as
something this script changes.

### 3. Instead of a modeled `Tmax` formula, real historical run telemetry — pulled live, not estimated

The mandate's Block 1 asks for a formula (`Tmax = (Base_Latency + P) × (1 + J) + S`) with per-actor
constants for base latency, payload complexity, jitter, and safety margin. Inventing numeric values
for four unmeasured constants across 28 actors would be fabrication, so instead: Apify records real
`stats.runTimeSecs` and `stats.memMaxBytes` for every run an actor has ever executed, retrievable via
`GET /v2/acts/{id}/runs` (run list) and `GET /v2/actor-runs/{runId}` (per-run detail). That data was
pulled live for all 28 actors.

**Real result: 12 of the 28 actors have actual production run history; 16 have never been run in
production at all** (`total` run count of 0 on the account's own run-list endpoint — these are
actors built and published but not yet scheduled/invoked by any customer or by Stefano). For those
16, no timeout/memory change is recommended below — there is no data to justify one, and guessing
risks killing a legitimate future run on an actor nobody has ever actually profiled.

For the 12 with history, here is the complete real dataset (every run that actor has ever
successfully completed, not a sample):

| Actor | Real runs (n) | Max runtime | Avg runtime | Peak memory used |
|---|---|---|---|---|
| `singapore-acra-registry-monitor` | 2 | **971.5s** (16.2 min) | 510.6s | 613 MB |
| `eu-ted-procurement-delta-monitor` | 2 | 429.2s | 252.3s | 96 MB |
| `sec-enforcement-litigation-delta-feed` | 2 | 186.2s | 100.1s | 136 MB |
| `mendoza-compras-monitor` | 1 | 98.1s | 98.1s | 68 MB |
| `uae-corporate-registry-monitor` | 3 | 41.5s | 37.9s | 117 MB |
| `aozora-bunko-public-domain-text-feed` | 2 | 10.7s | 9.3s | 320 MB |
| `regione-lombardia-grants-registry-monitor` | 2 | 9.1s | 6.6s | 72 MB |
| `uk-modern-slavery-statement-registry-monitor` | 1 | 7.6s | 7.6s | 270 MB |
| `actor-19-maritime-sanctions-monitor` | 3 | 6.8s | 6.5s | 586 MB |
| `diario-oficial-cl-monitor` | 1 | 6.3s | 6.3s | 41 MB |
| `emerging-market-sovereign-debt-auction-monitor` | 1 | 5.6s | 5.6s | 59 MB |
| `ai-crawler-content-signal-permission-monitor` | 1 | 2.9s | 2.9s | 56 MB |

**A genuinely new finding, not previously documented anywhere in this fleet's docs**:
`singapore-acra-registry-monitor` is the slowest actor in the entire fleet by a wide margin — its
real worst-case run (971.5s) is more than double `eu-ted-procurement-delta-monitor`'s own
README-disclosed worst case (417s), which until now was the fleet's only documented slow-runner.
Nothing in this actor's own Store listing or README currently discloses this. Worth a follow-up
README update independent of this resource-limits work.

Every actor with real data — even the two slow ones — is also running at a small fraction of its
*configured* memory: `singapore-acra` (the heaviest) peaks at 613 MB against a 4096 MB allocation
(15% utilization); the lightest, `ai-crawler-content-signal-permission-monitor`, peaks at 56 MB
against the same 4096 MB (1.4% utilization). Memory has never been the actual constraint for any
run this fleet has ever executed — it's uniformly over-provisioned.

## Block 1 — Real per-actor data and recommendation methodology

Recommendations follow one explicit, disclosed rule set — no per-actor number was hand-picked:

- **No run history → no change.** Applies to 16 of 28 actors. The safe default stays at the
  platform's own 3600s / current memory tier until a real run exists to measure.
- **Run history exists, max observed runtime ≤ 15s → recommend 300s timeout.** A 28×–100× safety
  margin over the worst run seen, while cutting the blast radius of a genuinely stuck/hung run from
  a full hour to 5 minutes.
- **Max observed runtime 15s–120s → recommend 600s.** 6×–40× margin.
- **Max observed runtime 120s–500s (excluding the two flagged below) → recommend 1200s.** Applies to
  `sec-enforcement-litigation-delta-feed` only; 6.4× margin.
- **`eu-ted-procurement-delta-monitor` and `singapore-acra-registry-monitor` → no timeout change,
  kept at 3600s.** Both have only 2 real samples and real observed variance already spans a wide
  range (eu-ted: 252s–429s; singapore-acra: 49.7s–971.5s — note the *second* singapore-acra run was
  nearly 20× its first, the largest run-to-run variance seen anywhere in this dataset). Tightening
  a timeout on that little data, on the fleet's two actual slow-runners, is exactly the kind of
  change that could break a legitimate future run. Left alone by design, not by oversight.
- **Memory: recommend round-up-to-next-power-of-2 of (2 × real peak memory used), floor 256 MB.**
  Only for the 12 actors with real data; the 16 without are left unchanged for the same reason as
  timeout.

## Block 2 — Full 28-actor table, grouped by real domain

| Actor | Domain | Real Run Data | Max/Avg Runtime | Peak Mem | Current (timeout/mem) | Recommended (timeout/mem) | Notes |
|---|---|---|---|---|---|---|---|
| actor-19-maritime-sanctions-monitor | Sanctions & Trade Compliance | Yes (n=3) | 6.8s / 6.5s | 586MB | 3600s / 4096MB | 300s / 2048MB **(change)** | Real max observed runtime 6.8s, avg 6.5s (n=3) — 44.1x safety margin over worst observed run. Real peak memory 586MB — recommended 2048MB is ~2x peak, rounded to nearest Apify memory tier. |
| actor-20-mdb-procurement-monitor | Development Finance Procurement | None ever | — | — | 3600s / 4096MB | 3600s / 4096MB | No production run history — insufficient data to justify changing platform default; left unchanged. |
| actor-21-patent-ip-enforcement-monitor | Patent & IP Enforcement | None ever | — | — | 3600s / 4096MB | 3600s / 4096MB | No production run history — insufficient data to justify changing platform default; left unchanged. Flags: BYOK optional |
| kipris-patent-trademark-status-monitor | Patent & IP Enforcement | None ever | — | — | 3600s / 4096MB | 3600s / 4096MB | No production run history — insufficient data to justify changing platform default; left unchanged. Flags: BYOK required |
| actor-22-drug-safety-recalls-monitor | Pharma Safety & Clinical Trials | None ever | — | — | 3600s / 4096MB | 3600s / 4096MB | No production run history — insufficient data to justify changing platform default; left unchanged. |
| actor-24-clinical-trials-delta-engine | Pharma Safety & Clinical Trials | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — insufficient data to justify changing platform default; left unchanged. |
| singapore-acra-registry-monitor | Corporate Registries | Yes (n=2) | 971.5s / 510.6s | 613MB | 3600s / 4096MB | 3600s / 2048MB **(change)** | Real max observed runtime 971.5s (n=2) — fleet's slowest actor by far; only 2 real samples, kept at platform default rather than tightening on thin data. Real peak memory 613MB — recommended 2048MB is ~2x peak, rounded to nearest Apify memory tier. |
| uk-modern-slavery-statement-registry-monitor | Corporate Registries | Yes (n=1) | 7.6s / 7.6s | 270MB | 3600s / 4096MB | 300s / 1024MB **(change)** | Real max observed runtime 7.6s, avg 7.6s (n=1) — 39.5x safety margin over worst observed run. Real peak memory 270MB — recommended 1024MB is ~2x peak, rounded to nearest Apify memory tier. |
| uae-corporate-registry-monitor | Corporate Registries | Yes (n=3) | 41.5s / 37.9s | 117MB | 3600s / 4096MB | 600s / 256MB **(change)** | Real max observed runtime 41.5s, avg 37.9s (n=3) — 14.5x safety margin over worst observed run. Real peak memory 117MB — recommended 256MB is ~2x peak, rounded to nearest Apify memory tier. |
| actor-18-b2b-lead-magnet | B2B Data Enrichment | None ever | — | — | 3600s / 4096MB | 3600s / 4096MB | No production run history — insufficient data to justify changing platform default; left unchanged. Flags: BYOK optional |
| ai-crawler-content-signal-permission-monitor | AI Crawler & Content Governance | Yes (n=1) | 2.9s / 2.9s | 56MB | 3600s / 4096MB | 300s / 256MB **(change)** | Real max observed runtime 2.9s (n=1) — 103.4x safety margin. Real peak memory 56MB — recommended 256MB. Flags: input-level concurrency control `concurrency` (default 15, max 50) |
| aozora-bunko-public-domain-text-feed | Digital Archives & Publishing | Yes (n=2) | 10.7s / 9.3s | 320MB | 3600s / 4096MB | 300s / 1024MB **(change)** | Real max observed runtime 10.7s, avg 9.3s (n=2) — 28.0x safety margin. Real peak memory 320MB — recommended 1024MB. |
| sec-enforcement-litigation-delta-feed | Securities & Financial Enforcement | Yes (n=2) | 186.2s / 100.1s | 136MB | 3600s / 4096MB | 1200s / 512MB **(change)** | Real max observed runtime 186.2s, avg 100.1s (n=2) — 6.4x safety margin. Real peak memory 136MB — recommended 512MB. |
| emerging-market-sovereign-debt-auction-monitor | Financial Markets & Sovereign Debt | Yes (n=1) | 5.6s / 5.6s | 59MB | 3600s / 4096MB | 300s / 256MB **(change)** | Real max observed runtime 5.6s (n=1) — 53.6x safety margin. Real peak memory 59MB — recommended 256MB. |
| page-metadata-extractor | SEO & Data Pipelines | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: Crawlee CheerioCrawler |
| australia-grantconnect-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: input-level concurrency control `maxConcurrency` (default 5, max 10) |
| cordoba-compras-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: Paid Residential+AR proxy required |
| diario-oficial-cl-monitor | Government Registers & Procurement | Yes (n=1) | 6.3s / 6.3s | 41MB | 3600s / 512MB | 300s / 256MB **(change)** | Real max observed runtime 6.3s (n=1) — 47.6x safety margin. Real peak memory 41MB — recommended 256MB. |
| entrerios-compras-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. |
| eu-ted-procurement-delta-monitor | Government Registers & Procurement | Yes (n=2) | 429.2s / 252.3s | 96MB | 3600s / 4096MB | 3600s / 256MB **(change)** | Real max observed runtime 429.2s (n=2); README separately discloses up to 417s TED-network-latency worst case. Timeout kept at platform default — real observed variance across just 2 runs (252s–429s) means true tail risk isn't well characterized yet. Real peak memory 96MB — recommended 256MB. |
| florida-tenders-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: input-level concurrency control `maxConcurrency` (default 5, max 10) |
| mendoza-compras-monitor | Government Registers & Procurement | Yes (n=1) | 98.1s / 98.1s | 68MB | 3600s / 512MB | 600s / 256MB **(change)** | Real max observed runtime 98.1s (n=1) — 6.1x safety margin. Real peak memory 68MB — recommended 256MB. |
| pba-tenders-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: Crawlee CheerioCrawler |
| regione-lombardia-grants-registry-monitor | Government Registers & Procurement | Yes (n=2) | 9.1s / 6.6s | 72MB | 3600s / 4096MB | 300s / 256MB **(change)** | Real max observed runtime 9.1s, avg 6.6s (n=2) — 33.0x safety margin. Real peak memory 72MB — recommended 256MB. |
| salta-compras-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. |
| santafe-compras-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: input-level concurrency control `maxConcurrency` (default 5, max 10) |
| tucuman-compras-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. |
| uk-hse-enforcement-monitor | Government Registers & Procurement | None ever | — | — | 3600s / 512MB | 3600s / 512MB | No production run history — left unchanged. Flags: input-level concurrency control `maxConcurrency` (default 5, max 10) |

**Summary**: 12 of 28 actors get a recommended change (all reductions — shorter timeout, smaller
memory — never an increase, since no real data anywhere in this fleet suggests any actor is
currently under-provisioned). 16 of 28 are left untouched because no real run has ever happened to
measure them. Financial-risk framing: the real exposure this whole exercise reduces is *wasted
compute-hour billing on a hung run* — at the current uniform 3600s ceiling, a stuck run on
`ai-crawler-content-signal-permission-monitor` (real runtime: 2.9s) could silently burn up to an
hour of billed compute before Apify kills it; at the recommended 300s, that exposure drops to 5
minutes. This is the one place a "financial risk" number in this document is real and computable —
not a fabricated risk score.

## Block 3 — `apply_apify_limits.py`

Written to this repo's root (`delta_registry_website/apply_apify_limits.py`) per the mandate's
instruction. **A note on that placement**: this script mutates Apify Actor infrastructure
account-wide, not this marketing website — it doesn't strictly belong in a website repo. It's placed
here anyway to match where every other deliverable this session has gone (there's no separate
ops/infra repo established in this account), and because the mandate explicitly asked for root
placement. Worth relocating to a dedicated ops repo if one gets created later.

**Real safety behavior, not just claimed**:
- **Dry-run by default.** Running it with no flags prints exactly what would change, for exactly
  the 12 actors with a real recommended change, and touches nothing. `--live` is required to
  actually PUT anything.
- **Reads the actor's current `defaultRunOptions` before writing**, merges in only `timeoutSecs`
  and `memoryMbytes`, and preserves the existing `build` field — this avoids the risk of a naive
  PUT wiping a field it didn't intend to touch.
- **Only ever writes the 12 actors with real data backing a change.** The other 16 are never
  touched by this script, matching Block 2's own "no data, no change" rule — there's no
  `--apply-to-everything` escape hatch that would undo that discipline.
- **No concurrency field is written anywhere** — consistent with the finding in correction #2 above
  that no such platform field exists to write to.
- Logs a before/after line per actor and a final summary; a failed PUT on one actor doesn't abort
  the rest.

**Actually run, not just written** — the dry-run below is a real transcript from executing this
script against the live account, not a predicted output. It caught two real Windows-specific bugs
on the first two attempts (subprocess couldn't resolve the `apify` CLI's `.cmd` shim without
`shutil.which`; stdout decoding defaulted to `cp1252` and choked on UTF-8 bytes in actor API
responses) — both fixed before this transcript was captured.

**Independently adversarially verified**, not just self-checked. A separate verification pass (5
independent agents, none with prior context on this document) was run afterward: one re-derived the
full 28-actor timeout/memory table from the raw telemetry JSON files completely independently and
diffed it against this document's Block 2 (28/28 match); one re-extracted the domain taxonomy fresh
from `lib/actors.ts` and diffed it against Block 1/2 (28/28 match); one made 3 live, read-only API
calls against the real account at verification time and confirmed the "current" column here still
matched production (3/3 match); one spot-checked 2 of the "zero run history" actors live and
confirmed they genuinely have 0 runs; one did an adversarial code review of the script against 7
named safety properties (dry-run default, Windows shim resolution, UTF-8 forcing, `build`
preservation, fixed 12-actor scope, no concurrency field, per-actor error isolation) — all 7 passed,
but it flagged three hardening gaps that have since been fixed in the version below: no subprocess
timeout (a hung/stale-auth CLI call could block indefinitely), no post-write re-fetch to confirm a
`--live` PUT's values actually persisted (a 200 response alone doesn't prove that), and an
unguarded `json.loads()` that would raise an opaque error on non-JSON stdout instead of a clear one.

```
=== DRY RUN - no changes will be made. Pass --live to apply. ===

  [DRY-RUN] actor-19-maritime-sanctions-monitor: 3600s/4096MB -> 300s/2048MB
  [DRY-RUN] ai-crawler-content-signal-permission-monitor: 3600s/4096MB -> 300s/256MB
  [DRY-RUN] aozora-bunko-public-domain-text-feed: 3600s/4096MB -> 300s/1024MB
  [DRY-RUN] diario-oficial-cl-monitor: 3600s/512MB -> 300s/256MB
  [DRY-RUN] emerging-market-sovereign-debt-auction-monitor: 3600s/4096MB -> 300s/256MB
  [DRY-RUN] eu-ted-procurement-delta-monitor: 3600s/4096MB -> 3600s/256MB
  [DRY-RUN] mendoza-compras-monitor: 3600s/512MB -> 600s/256MB
  [DRY-RUN] regione-lombardia-grants-registry-monitor: 3600s/4096MB -> 300s/256MB
  [DRY-RUN] sec-enforcement-litigation-delta-feed: 3600s/4096MB -> 1200s/512MB
  [DRY-RUN] singapore-acra-registry-monitor: 3600s/4096MB -> 3600s/2048MB
  [DRY-RUN] uae-corporate-registry-monitor: 3600s/4096MB -> 600s/256MB
  [DRY-RUN] uk-modern-slavery-statement-registry-monitor: 3600s/4096MB -> 300s/1024MB

=== Summary ===
  changed: 0
  would-change: 12
  skipped: 0
  unconfirmed: 0
  failed: 0
```

```python
#!/usr/bin/env python3
"""Apply data-driven timeoutSecs/memoryMbytes recommendations from
RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md to the live Apify actors.

Dry-run by default. Requires --live to actually PUT changes. Only touches the
12 actors in RECOMMENDATIONS below - every one backed by real historical run
data (see the analysis doc for the full dataset and methodology). Never
writes a concurrency field: no such field exists in Apify's defaultRunOptions
(verified against the full Actor API resource for all 28 actors in this
fleet on 2026-09-17/18 - see the analysis doc, correction #2).
"""

import argparse
import json
import shutil
import subprocess
import sys

OWNER = "stefano_seggio"
API_TIMEOUT_SECS = 60

# On Windows, the apify CLI is a .cmd shim; subprocess.run() with a plain
# ["apify", ...] list can't resolve that without going through the shell.
# shutil.which() finds the real executable path (apify.cmd) so the command
# list stays argv-safe (no shell=True, no shell-injection risk from the
# JSON body argument).
APIFY_BIN = shutil.which("apify")
if APIFY_BIN is None:
    sys.exit("apify CLI not found on PATH")

# Every entry here is backed by real stats.runTimeSecs / stats.memMaxBytes
# pulled from this actor's own real run history via the Apify API - see
# RESOURCE_LIMITS_AND_RUNTIME_ANALYSIS.md Block 2 for the source data and
# the exact rule that produced each number. No entry here is a guess.
RECOMMENDATIONS = {
    "actor-19-maritime-sanctions-monitor": {"timeoutSecs": 300, "memoryMbytes": 2048},
    "ai-crawler-content-signal-permission-monitor": {"timeoutSecs": 300, "memoryMbytes": 256},
    "aozora-bunko-public-domain-text-feed": {"timeoutSecs": 300, "memoryMbytes": 1024},
    "diario-oficial-cl-monitor": {"timeoutSecs": 300, "memoryMbytes": 256},
    "emerging-market-sovereign-debt-auction-monitor": {"timeoutSecs": 300, "memoryMbytes": 256},
    "eu-ted-procurement-delta-monitor": {"timeoutSecs": 3600, "memoryMbytes": 256},
    "mendoza-compras-monitor": {"timeoutSecs": 600, "memoryMbytes": 256},
    "regione-lombardia-grants-registry-monitor": {"timeoutSecs": 300, "memoryMbytes": 256},
    "sec-enforcement-litigation-delta-feed": {"timeoutSecs": 1200, "memoryMbytes": 512},
    "singapore-acra-registry-monitor": {"timeoutSecs": 3600, "memoryMbytes": 2048},
    "uae-corporate-registry-monitor": {"timeoutSecs": 600, "memoryMbytes": 256},
    "uk-modern-slavery-statement-registry-monitor": {"timeoutSecs": 300, "memoryMbytes": 1024},
}


def apify_api(method, endpoint, body=None):
    cmd = [APIFY_BIN, "api", "-X", method, endpoint]
    if body is not None:
        cmd += ["-d", json.dumps(body)]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=API_TIMEOUT_SECS,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"apify api {method} {endpoint} timed out after {API_TIMEOUT_SECS}s "
            "(hung CLI process or stale/interactive auth prompt)"
        )
    if result.returncode != 0:
        raise RuntimeError(f"apify api {method} {endpoint} failed: {result.stderr.strip()}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"apify api {method} {endpoint} returned non-JSON stdout: {exc}. "
            f"Raw output: {result.stdout[:200]!r}"
        )


def get_current_default_run_options(slug):
    resp = apify_api("GET", f"acts/{OWNER}~{slug}")
    return resp["data"].get("defaultRunOptions", {})


def apply_one(slug, rec, live):
    current = get_current_default_run_options(slug)
    cur_timeout = current.get("timeoutSecs")
    cur_mem = current.get("memoryMbytes")
    new_timeout = rec["timeoutSecs"]
    new_mem = rec["memoryMbytes"]

    if cur_timeout == new_timeout and cur_mem == new_mem:
        print(f"  [SKIP]  {slug}: already at {new_timeout}s / {new_mem}MB")
        return "skipped"

    merged = dict(current)
    merged["timeoutSecs"] = new_timeout
    merged["memoryMbytes"] = new_mem

    action = "APPLY" if live else "DRY-RUN"
    print(
        f"  [{action}] {slug}: {cur_timeout}s/{cur_mem}MB -> {new_timeout}s/{new_mem}MB"
    )

    if not live:
        return "would-change"

    apify_api("PUT", f"acts/{OWNER}~{slug}", body={"defaultRunOptions": merged})

    # A 200 response only means Apify accepted the request - it doesn't prove
    # the values were actually persisted (a silent API-side validation quirk
    # could drop a field). Re-fetch and compare before calling this changed.
    after = get_current_default_run_options(slug)
    if after.get("timeoutSecs") == new_timeout and after.get("memoryMbytes") == new_mem:
        print(f"           confirmed: re-fetched {slug}, values persisted as sent")
        return "changed"
    else:
        print(
            f"           WARNING: {slug} PUT returned success but re-fetch shows "
            f"{after.get('timeoutSecs')}s/{after.get('memoryMbytes')}MB, not the "
            f"requested {new_timeout}s/{new_mem}MB"
        )
        return "unconfirmed"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--live",
        action="store_true",
        help="Actually apply changes. Without this flag, only prints what would change.",
    )
    args = parser.parse_args()

    if not args.live:
        print("=== DRY RUN - no changes will be made. Pass --live to apply. ===\n")

    results = {"changed": 0, "would-change": 0, "skipped": 0, "unconfirmed": 0, "failed": 0}
    for slug, rec in RECOMMENDATIONS.items():
        try:
            outcome = apply_one(slug, rec, args.live)
            results[outcome] += 1
        except Exception as exc:
            print(f"  [FAIL]  {slug}: {exc}")
            results["failed"] += 1

    print("\n=== Summary ===")
    for k, v in results.items():
        print(f"  {k}: {v}")

    if results["failed"] or results["unconfirmed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**Not yet run live.** This has been reviewed, adversarially verified, and hardened but not executed
with `--live` against production — consistent with not applying infrastructure changes to actors
that may have real customers with active schedules against them, without a separate explicit
go-ahead. Recommended next step: run it without `--live` first (safe, read-only against the API) to
see the exact diff, then decide whether to run `--live` for all 12 at once or roll it out
incrementally.
