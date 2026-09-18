#!/usr/bin/env python3
"""Trigger real, minimal-footprint test runs on actors with zero production
run history, to capture baseline telemetry (runtime, memory, dataset schema).

Dry-run by default. Requires --live to actually launch real Apify runs -
these are NOT free and NOT reversible: each run incurs real (small) PPE
cost and permanently establishes that actor's delta-engine baseline state,
which affects what a real future customer's first run will see as "new".

Excludes 2 of the 15 real zero-run actors deliberately:
- kipris-patent-trademark-status-monitor: byoKiprisServiceKey is a REQUIRED
  input field (BYOK). There is no key available to run this with - it
  cannot be tested without Stefano's own real KIPRIS Plus subscription key.
- cordoba-compras-monitor: requires a paid Residential+AR Apify Proxy to
  function (a real, documented, non-trivial cost, not a PPE micro-cost).
  Excluded from the default batch pending a separate, explicit decision on
  proxy budget - see RUN_SEPARATELY below.
"""

import argparse
import json
import shutil
import subprocess
import sys
import time

OWNER = "stefano_seggio"
API_TIMEOUT_SECS = 60

APIFY_BIN = shutil.which("apify")
if APIFY_BIN is None:
    sys.exit("apify CLI not found on PATH")

# Every input here is the real actor's own minimal-footprint configuration,
# read from its real .actor/input_schema.json (or live API for TARBALL-
# sourced actors) - not guessed. maxItems/maxPages/maxItemsPerSource capped
# low (1-3) specifically to bound real cost and runtime for a baseline test,
# not to exercise full production behavior.
TEST_RUNS = {
    "actor-18-b2b-lead-magnet": {},  # seedList defaults to [] - near-zero-cost completion, proves the run mechanics work
    "actor-20-mdb-procurement-monitor": {"maxItemsPerSource": 3},
    "actor-21-patent-ip-enforcement-monitor": {"maxItemsPerSource": 3},
    "actor-22-drug-safety-recalls-monitor": {"maxItemsPerSource": 3},
    "actor-24-clinical-trials-delta-engine": {"maxPages": 1},
    "australia-grantconnect-monitor": {"maxItems": 3},
    "entrerios-compras-monitor": {"maxItems": 3},
    "florida-tenders-monitor": {"maxItems": 3},
    "page-metadata-extractor": {"startUrls": [{"url": "https://example.com"}], "maxRequestsPerCrawl": 1},
    "pba-tenders-monitor": {"maxItems": 3},
    "salta-compras-monitor": {"maxItems": 3},
    "santafe-compras-monitor": {"maxItems": 3},
    "tucuman-compras-monitor": {"maxItems": 3},
}

# Not included in TEST_RUNS above - real reasons, not oversights:
RUN_SEPARATELY = {
    "kipris-patent-trademark-status-monitor": "Requires byoKiprisServiceKey (REQUIRED field, BYOK) - no key available.",
    "cordoba-compras-monitor": "Requires a paid Residential+AR Apify Proxy - real non-trivial cost, needs separate budget approval before running.",
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
        raise RuntimeError(f"apify api {method} {endpoint} timed out after {API_TIMEOUT_SECS}s")
    if result.returncode != 0:
        raise RuntimeError(f"apify api {method} {endpoint} failed: {result.stderr.strip()}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"apify api {method} {endpoint} returned non-JSON stdout: {exc}. Raw: {result.stdout[:200]!r}")


def launch_one(slug, test_input, live):
    action = "LAUNCH" if live else "DRY-RUN"
    print(f"  [{action}] {slug}: input={json.dumps(test_input)}")
    if not live:
        return None
    resp = apify_api("POST", f"acts/{OWNER}~{slug}/runs", body=test_input)
    run = resp["data"]
    run_id = run["id"]
    print(f"           launched: runId={run_id} status={run['status']}")
    return run_id


def check_one(slug, run_id):
    resp = apify_api("GET", f"actor-runs/{run_id}")
    run = resp["data"]
    stats = run.get("stats", {})
    print(
        f"  {slug}: status={run['status']} "
        f"runTimeSecs={stats.get('runTimeSecs')} "
        f"memMaxBytes={stats.get('memMaxBytes')} "
        f"computeUnits={stats.get('computeUnits')} "
        f"datasetId={run.get('defaultDatasetId')}"
    )
    return run


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="Actually launch real runs. Without this, only prints what would run.")
    parser.add_argument("--check", metavar="RUNIDS_JSON_FILE", help="Check status of previously-launched runs from a JSON file of {slug: runId}.")
    parser.add_argument("--only", metavar="SLUG", help="Restrict to a single actor slug (for testing the mechanism safely before running the full batch).")
    parser.add_argument("--exclude", metavar="SLUG1,SLUG2", help="Comma-separated slugs to skip (e.g. ones already tested in a prior run).")
    args = parser.parse_args()

    if args.check:
        with open(args.check, encoding="utf-8") as f:
            run_ids = json.load(f)
        print("=== Checking real status of previously-launched runs ===\n")
        for slug, run_id in run_ids.items():
            try:
                check_one(slug, run_id)
            except Exception as exc:
                print(f"  [FAIL] {slug}: {exc}")
        return

    targets = TEST_RUNS
    if args.only:
        if args.only not in TEST_RUNS:
            sys.exit(f"{args.only} not in TEST_RUNS")
        targets = {args.only: TEST_RUNS[args.only]}
    if args.exclude:
        exclude_set = set(args.exclude.split(","))
        unknown = exclude_set - set(TEST_RUNS.keys())
        if unknown:
            sys.exit(f"--exclude names slugs not in TEST_RUNS: {sorted(unknown)}")
        targets = {k: v for k, v in targets.items() if k not in exclude_set}

    if not args.live:
        print("=== DRY RUN - no real Apify runs will be launched. Pass --live to launch. ===\n")
    else:
        print("=== LIVE - launching real Apify runs. Real (small) cost will be incurred. ===\n")

    launched = {}
    failed = []
    for slug, test_input in targets.items():
        try:
            run_id = launch_one(slug, test_input, args.live)
            if run_id:
                launched[slug] = run_id
        except Exception as exc:
            print(f"  [FAIL] {slug}: {exc}")
            failed.append(slug)
        if args.live:
            time.sleep(1)  # avoid bursting all 13 run-launch requests in the same instant

    if args.live and launched:
        out_path = "launched_run_ids.json"
        existing = {}
        try:
            with open(out_path, encoding="utf-8") as f:
                existing = json.load(f)
        except FileNotFoundError:
            pass
        existing.update(launched)  # merge, don't overwrite prior runs from an earlier invocation
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
        print(f"\nLaunched {len(launched)} real runs. Run IDs saved to {out_path} ({len(existing)} total tracked).")
        print(f"Check status later with: python run_baseline_telemetry_tests.py --check {out_path}")

    print("\n=== Not included - needs a separate decision ===")
    for slug, reason in RUN_SEPARATELY.items():
        print(f"  {slug}: {reason}")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
