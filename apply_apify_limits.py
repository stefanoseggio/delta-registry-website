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
