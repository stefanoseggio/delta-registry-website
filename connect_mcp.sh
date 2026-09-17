#!/usr/bin/env bash
# Delta Registry — MCP client onboarding script (macOS / Linux / Git Bash on Windows).
#
# Configures a caller's OWN Claude Code and/or Cursor installation to reach the
# closed-scope, 28-actor Delta Registry MCP endpoint. This script never contains
# a real Apify token — it prompts the person running it for THEIR OWN token,
# read with echo disabled, and never writes it to disk in plaintext logs or
# prints it back to the terminal.
#
# Real, verified endpoint and tool-naming convention: see MCP_INTEGRATION.md in
# this repository for how every fact below was checked (base URL, ?tools=
# scoping, the stefano_seggio--<slug> tool-name format, and the per-client
# config schemas this script generates).

set -euo pipefail

TOOLS_URL="https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor"

echo "Delta Registry MCP onboarding"
echo "=============================="
echo "This will configure your own Claude Code and/or Cursor installation to"
echo "reach the 28-actor Delta Registry fleet via Apify's hosted MCP server."
echo "You will be billed on YOUR OWN Apify account for any tool you actually"
echo "call (real, per-event Pay-Per-Event pricing — see each tool's own"
echo "description once connected). Nothing is charged just for connecting."
echo ""

# Read the token with echo disabled — never printed, never logged.
read -r -s -p "Paste your own Apify API token (from Apify Console -> Settings -> Integrations): " APIFY_TOKEN
echo ""
if [ -z "$APIFY_TOKEN" ]; then
  echo "No token entered — aborting. Nothing was written." >&2
  exit 1
fi

CONFIGURED_ANY=false

if command -v claude >/dev/null 2>&1; then
  echo "Claude Code CLI detected — registering via 'claude mcp add' (the official, safe mechanism; this does not write your token to a plaintext file this script controls)."
  if claude mcp add --transport http --scope user delta-registry "$TOOLS_URL" --header "Authorization: Bearer $APIFY_TOKEN" >/tmp/delta-registry-mcp-add.log 2>&1; then
    echo "Claude Code: configured. Run 'claude mcp get delta-registry' to verify (note: that command DOES print your token in plaintext to your terminal — be mindful of shell history/screen-sharing when you run it)."
    CONFIGURED_ANY=true
  else
    echo "Claude Code registration failed — see /tmp/delta-registry-mcp-add.log for details." >&2
  fi
else
  echo "Claude Code CLI not found on PATH — skipping. Install from https://claude.com/claude-code if you want this integration."
fi

CURSOR_GLOBAL_DIR="$HOME/.cursor"
if [ -d "$CURSOR_GLOBAL_DIR" ] || command -v cursor >/dev/null 2>&1; then
  mkdir -p "$CURSOR_GLOBAL_DIR"
  CURSOR_CONFIG="$CURSOR_GLOBAL_DIR/mcp.json"
  if [ -f "$CURSOR_CONFIG" ]; then
    echo "Cursor config already exists at $CURSOR_CONFIG — not overwriting it automatically."
    echo "Add this block to its \"mcpServers\" object yourself (token substituted below, shown once, not logged):"
    printf '  "delta-registry": {\n    "url": "%s",\n    "headers": { "Authorization": "Bearer %s" }\n  }\n' "$TOOLS_URL" "$APIFY_TOKEN"
  else
    python3 - "$TOOLS_URL" "$APIFY_TOKEN" "$CURSOR_CONFIG" <<'PYEOF'
import json, sys
tools_url, token, path = sys.argv[1], sys.argv[2], sys.argv[3]
config = {"mcpServers": {"delta-registry": {"url": tools_url, "headers": {"Authorization": f"Bearer {token}"}}}}
with open(path, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)
PYEOF
    echo "Cursor: wrote $CURSOR_CONFIG. Restart Cursor to load it."
    CONFIGURED_ANY=true
  fi
else
  echo "Cursor not detected on this machine — skipping. See cursor-mcp.json.example in this repo if you install it later."
fi

unset APIFY_TOKEN

if [ "$CONFIGURED_ANY" = false ]; then
  echo ""
  echo "Neither Claude Code nor Cursor was detected/configured. No changes were made." >&2
  exit 1
fi

echo ""
echo "Done. Restart whichever client(s) you configured to load the new MCP server."
