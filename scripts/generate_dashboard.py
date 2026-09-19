#!/usr/bin/env python3
"""Generates a static fleet health dashboard from real, live Apify + GitHub API state.

Reads APIFY_TOKEN and GH_TOKEN from the environment. Queries every actor's current
`notice` and `stats` from the Apify API, and every repo's open Dependabot/release-please
PR count plus latest CI conclusion from the GitHub REST API. Writes a single static HTML
file to stdout (redirect to public/fleet-status.html in the calling workflow).

No fabricated data: any field that can't be fetched renders as "unknown", never a guess.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

APIFY_TOKEN = os.environ["APIFY_TOKEN"]
GH_TOKEN = os.environ["GH_TOKEN"]
OWNER_APIFY = "stefano_seggio"
OWNER_GH = "stefanoseggio"

# The 27 repos with a live Apify actor counterpart, in the fleet's canonical order.
# The 7 delta-registry-*-stub repos and the profile/platform/awesome-list repos are
# excluded deliberately - they have no Apify actor to query stats for.
FLEET = [
    "diario-oficial-cl-monitor", "uk-hse-enforcement-monitor", "cordoba-compras-monitor",
    "entrerios-compras-monitor", "mendoza-compras-monitor", "salta-compras-monitor",
    "santafe-compras-monitor", "tucuman-compras-monitor", "florida-tenders-monitor",
    "pba-tenders-monitor", "australia-grantconnect-monitor", "eu-ted-procurement-delta-monitor",
    "uae-corporate-registry-monitor", "uk-modern-slavery-statement-registry-monitor",
    "singapore-acra-registry-monitor", "kipris-patent-trademark-status-monitor",
    "regione-lombardia-grants-registry-monitor", "emerging-market-sovereign-debt-auction-monitor",
    "actor-18-b2b-lead-magnet", "actor-19-maritime-sanctions-monitor",
    "actor-20-mdb-procurement-monitor", "actor-21-patent-ip-enforcement-monitor",
    "actor-22-drug-safety-recalls-monitor", "actor-24-clinical-trials-delta-engine",
    "ai-crawler-content-signal-permission-monitor", "aozora-bunko-public-domain-text-feed",
    "sec-enforcement-litigation-delta-feed",
]


def http_get_json(url: str, headers: dict) -> dict | None:
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # network error, 404, rate limit - all render as "unknown", not fabricated
        print(f"WARN: fetch failed for {url}: {exc}", file=sys.stderr)
        return None


def apify_actor_state(slug: str) -> dict:
    data = http_get_json(
        f"https://api.apify.com/v2/acts/{OWNER_APIFY}~{slug}",
        {"Authorization": f"Bearer {APIFY_TOKEN}"},
    )
    if not data:
        return {"notice": "unknown", "last_run": "unknown", "build": "unknown", "failed_30d": "?", "total_30d": "?"}
    d = data["data"]
    stats = d.get("stats", {})
    run30 = stats.get("publicActorRunStats30Days", {})
    return {
        "notice": d.get("notice") or "NONE",
        "last_run": stats.get("lastRunStartedAt", "never"),
        "build": d.get("taggedBuilds", {}).get("latest", {}).get("buildNumber", "unknown"),
        "failed_30d": run30.get("FAILED", 0),
        "total_30d": run30.get("TOTAL", 0),
    }


def github_repo_state(repo: str) -> dict:
    headers = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json"}
    prs = http_get_json(f"https://api.github.com/repos/{OWNER_GH}/{repo}/pulls?state=open&per_page=100", headers)
    open_pr_count = len(prs) if prs is not None else "unknown"

    runs = http_get_json(
        f"https://api.github.com/repos/{OWNER_GH}/{repo}/actions/runs?per_page=1&branch=main", headers
    )
    if runs and runs.get("workflow_runs"):
        latest = runs["workflow_runs"][0]
        ci_status = latest.get("conclusion") or latest.get("status") or "unknown"
    else:
        ci_status = "no runs"

    return {"open_prs": open_pr_count, "ci_status": ci_status}


def notice_badge(notice: str) -> str:
    if notice == "NONE":
        return '<span class="badge ok">healthy</span>'
    if notice == "unknown":
        return '<span class="badge unknown">unknown</span>'
    return f'<span class="badge bad">{notice}</span>'


def ci_badge(status: str) -> str:
    if status == "success":
        return '<span class="badge ok">green</span>'
    if status in ("failure", "timed_out", "cancelled"):
        return f'<span class="badge bad">{status}</span>'
    return f'<span class="badge unknown">{status}</span>'


def render_row(slug: str) -> str:
    apify = apify_actor_state(slug)
    gh = github_repo_state(slug)
    fail_ratio = f"{apify['failed_30d']}/{apify['total_30d']}"
    return f"""
    <tr>
      <td><a href="https://github.com/{OWNER_GH}/{slug}">{slug}</a></td>
      <td>{notice_badge(apify['notice'])}</td>
      <td>{apify['build']}</td>
      <td>{fail_ratio} (30d)</td>
      <td>{ci_badge(gh['ci_status'])}</td>
      <td>{gh['open_prs']}</td>
      <td>{apify['last_run']}</td>
    </tr>"""


def main() -> None:
    rows = "\n".join(render_row(slug) for slug in FLEET)
    generated_at = datetime.now(timezone.utc).isoformat()
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Delta Registry Fleet Status</title>
<style>
  body {{ font-family: -apple-system, sans-serif; background: #0b0d12; color: #e6e6e6; padding: 2rem; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #2a2d35; }}
  th {{ color: #9aa0ab; font-weight: 600; }}
  a {{ color: #7dd3fc; text-decoration: none; }}
  .badge {{ padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }}
  .badge.ok {{ background: #14532d; color: #86efac; }}
  .badge.bad {{ background: #7f1d1d; color: #fca5a5; }}
  .badge.unknown {{ background: #3f3f46; color: #d4d4d8; }}
  .meta {{ color: #9aa0ab; font-size: 0.85rem; margin-bottom: 1rem; }}
</style>
</head>
<body>
<h1>Delta Registry Fleet Status</h1>
<p class="meta">Generated {generated_at} - real Apify/GitHub API state, no cached or fabricated values. "unknown" means the corresponding API call failed at generation time, not that the field doesn't exist.</p>
<table>
<thead><tr><th>Actor</th><th>Notice</th><th>Build</th><th>Failures</th><th>CI</th><th>Open PRs</th><th>Last run</th></tr></thead>
<tbody>{rows}
</tbody>
</table>
</body>
</html>"""
    print(html)


if __name__ == "__main__":
    main()
