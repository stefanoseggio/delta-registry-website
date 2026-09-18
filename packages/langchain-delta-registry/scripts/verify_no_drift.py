#!/usr/bin/env python3
"""Real, executable drift-verification script for langchain-delta-registry.

Compares the actually-packaged tool modules under src/langchain_delta_registry/ against
drift-manifest.json — the real, machine-generated record of what
lib/schema-generator/langchain-package-generator.ts produced, written by that same generator run
(not hand-maintained, so it can't itself drift from what was actually generated).

Exits non-zero on any real discrepancy, with a specific, actionable message per failure — designed
to be the CI pre-flight gate referenced in .github/workflows/publish.yml, and equally runnable
locally: `python scripts/verify_no_drift.py`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PACKAGE_ROOT / "src" / "langchain_delta_registry"
MANIFEST_PATH = PACKAGE_ROOT / "drift-manifest.json"

APIFY_ACTOR_ID_RE = re.compile(r"APIFY_ACTOR_ID = '([^']+)'")


def fail(message: str) -> None:
    print(f"DRIFT DETECTED: {message}", file=sys.stderr)


def main() -> int:
    if not MANIFEST_PATH.exists():
        print(
            f"ERROR: {MANIFEST_PATH} does not exist. Run the generator first: "
            f"node lib/schema-generator/langchain-package-generator.js "
            f"(via the compiled-then-run pattern documented in lib/schema-generator/README.md).",
            file=sys.stderr,
        )
        return 2

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    expected_modules = {m["moduleName"]: m for m in manifest["modules"]}

    failures = 0

    if manifest["actorCount"] != 28:
        fail(f"manifest itself claims {manifest['actorCount']} actors, expected 28 — the real fleet count has changed; investigate before proceeding.")
        failures += 1

    # 1. Every expected module file exists and is non-empty.
    for module_name, entry in expected_modules.items():
        module_path = SRC_DIR / f"{module_name}.py"
        if not module_path.exists():
            fail(f"expected module {module_path.name} (actor '{entry['slug']}') is missing from {SRC_DIR}")
            failures += 1
            continue
        content = module_path.read_text(encoding="utf-8")
        if not content.strip():
            fail(f"{module_path.name} exists but is empty")
            failures += 1
            continue

        # 2. Each module's embedded APIFY_ACTOR_ID matches the manifest's real, current value.
        match = APIFY_ACTOR_ID_RE.search(content)
        if not match:
            fail(f"{module_path.name} has no APIFY_ACTOR_ID assignment — malformed generated file")
            failures += 1
            continue
        actual_id = match.group(1)
        if actual_id != entry["apifyActorId"]:
            fail(
                f"{module_path.name}: APIFY_ACTOR_ID is '{actual_id}' but the manifest (generated "
                f"from lib/schema-generator/actor-registry.ts) says it should be '{entry['apifyActorId']}' "
                f"for actor '{entry['slug']}' — this file was hand-edited or regenerated from a stale source."
            )
            failures += 1

    # 3. No unexpected extra .py module in the package that isn't in the manifest (excluding the
    #    two real, hand-written non-generated files).
    on_disk_modules = {p.stem for p in SRC_DIR.glob("*.py") if p.stem not in ("_client", "__init__")}
    manifest_modules = set(expected_modules.keys())
    extra = on_disk_modules - manifest_modules
    if extra:
        fail(f"module file(s) on disk with no matching manifest entry (stale from a previous generator run?): {sorted(extra)}")
        failures += 1

    missing = manifest_modules - on_disk_modules
    if missing:
        fail(f"manifest expects module(s) not found on disk: {sorted(missing)}")
        failures += 1

    if failures:
        print(f"\n{failures} drift issue(s) found. Regenerate with the real generator rather than hand-editing.", file=sys.stderr)
        return 1

    print(f"No drift: all {len(expected_modules)} packaged modules match the real, current actor registry exactly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
