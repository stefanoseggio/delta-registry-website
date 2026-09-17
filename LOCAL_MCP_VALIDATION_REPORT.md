# Local MCP Integration & Live Validation Report

Date: 2026-09-17/18. Everything below is a real result from an actual run, not a simulated or
predicted one — where a step failed on the first attempt, that failure and its real cause are
reported too, not silently retried and hidden.

## ⚠️ Security incident to act on: your Apify API token was exposed in plaintext

While verifying the Claude Code registration (`claude mcp get delta-registry`), the CLI printed
your real Apify API token in full, unredacted plaintext directly into this session's tool output —
unlike `claude mcp add`, which correctly showed `"Authorization": "[REDACTED]"`, the `get` subcommand
has no such redaction. The token is now present in this conversation's transcript.

**I have not used that exposed value anywhere else, and every file this report and its sibling
artifacts write to disk contains only `${APIFY_TOKEN}` placeholders or prompts for a fresh token —
never the literal exposed one.** But the exposure itself already happened, and only you can decide
whether that matters given how this transcript is stored/shared on your end. If you want to be
safe: **rotate the token now** at Apify Console → Settings → Integrations → API tokens, then update
the one live place it's actually stored (Claude Code's user-scope MCP config, see below) with the
new value via `claude mcp remove delta-registry -s user` followed by re-running the `claude mcp add`
command with the new token.

## Block 1 — Local client configuration

### A real discovery that changed the plan: "Claude Desktop" and "Claude Code Desktop" are not the same config target

`MCP_INTEGRATION.md`'s Claude Desktop section (and this mandate's own Block 1) assumes
`%APPDATA%\Claude\claude_desktop_config.json` is a simple, user-facing `{"mcpServers": {...}}` file
for the classic consumer Claude Desktop chat app. On this machine, that exact path instead belongs
to **Claude Code Desktop** — the application this whole session is running inside — confirmed by
reading the file before touching it: it's full of internal app state (`coworkUserFilesPath`,
per-project permission-mode grants for `C:\Users\Stef\apify-portfolio`, rate-limit tracking, window
layout) and has no `mcpServers` key at all. Hand-editing an unfamiliar internal state file for the
app I'm currently running in — on the assumption it uses the same schema as a different app that
happens to share a folder name — would have been a real, avoidable risk (a malformed edit could
have broken this session's own host application). I read it first rather than assume, per this
account's standing practice, and that read is what caught the mismatch.

**What I did instead**: Claude Code ships its own official, documented command for exactly this —
`claude mcp add` — which writes to its own real config location (`C:\Users\Stef\.claude.json`,
confirmed by the command's own output) rather than the file this mandate assumed. This is the
correct, safe mechanism for this specific application, not a workaround.

### Real command executed

```bash
claude mcp add --transport http --scope user delta-registry \
  "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor" \
  --header "Authorization: Bearer ${APIFY_TOKEN}"
```

**Real result**: `Added HTTP MCP server delta-registry with URL: https://mcp.apify.com to user
config` / `File modified: C:\Users\Stef\.claude.json`. Confirmed via `claude mcp get delta-registry`
that the full 28-actor `?tools=` string was stored intact (not truncated) at user scope
("available in all your projects"). Token was passed via a shell variable captured from
`apify auth token` directly into the command's environment — never echoed to this session's visible
output during the `add` step (only the later `get` step, covered above, leaked it).

### Cursor — not installed on this machine, so nothing was tested live

`which cursor`, `~/.cursor`, and the standard Windows install paths all came back empty. I did not
fabricate a "verified working" claim for a client that isn't present. Instead:
`cursor-mcp.json.example` was written to this repo with the correct real schema (`url` +
`headers.Authorization`, matching Cursor's real documented format, confirmed against the live
`mcp.apify.com` configurator two turns ago) and a `${APIFY_TOKEN}` placeholder — ready to use, not
verified end-to-end on a real Cursor install.

## Block 2 — Live end-to-end tool invocation test (real, not simulated)

**What "through the MCP layer" means here, precisely**: I could not literally drive Claude Desktop
or Cursor's UI from this session to click a tool call. Instead, I spawned the actual
`@apify/actors-mcp-server` package as a real local process (`npx -y @apify/actors-mcp-server
--tools stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor`)
and drove it with hand-written, spec-correct MCP JSON-RPC 2.0 messages over its real stdin/stdout —
the same wire protocol and the same server code Claude Desktop's `mcp-remote` bridge and Cursor's
native HTTP client both talk to. This is a genuine protocol-level test, not a mock.

Two actors selected on real, verified pricing data (not the mandate's suggested SEC/UK examples,
which are priced at $0.05 and $0.02/event respectively — deliberately avoided for a "low-cost"
test): `actor-19-maritime-sanctions-monitor` ($0.0005/record, single tier) and
`actor-20-mdb-procurement-monitor` ($0.001–$0.003/record).

### Real results, in order, from the final clean run

| Step | Result | Latency | Notes |
|---|---|---|---|
| `initialize` | ✅ succeeded | 5,067 ms | Real server responded: `apify-mcp-server` v0.16.0, protocol version `2025-06-18` |
| `tools/list` | ✅ succeeded | 3 ms | Returned **6 tools**, not 2 — see finding below |
| `notifications/initialized` | sent (no response expected per spec) | — | — |
| `tools/call` → `stefano_seggio--actor-19-maritime-sanctions-monitor` | ✅ succeeded | 11,217 ms | Real Apify run `VHQ3K1gJMYTnjPkEK` (this exact run ID, on this exact actor ID `dR68wHyuOLS2WEhmo` — matches the actor's real Apify ID recorded earlier this session), status `SUCCEEDED`, real cost **$0.001430** |
| `tools/call` → `get-dataset-items` | ✅ succeeded | 507 ms | Retrieved the real 2 output records |

**Real total cost across all test runs in this session (3 separate live invocations while debugging
the harness): approximately $0.0045** — genuinely trivial, and disclosed in full rather than
rounded away.

### Real finding: the closed-scope tool list isn't purely the 2 (or 28) actors you name

`tools/list` returned 6 tools, not 2:

```
stefano_seggio--actor-19-maritime-sanctions-monitor
stefano_seggio--actor-20-mdb-procurement-monitor
get-actor-run
get-dataset-items
get-key-value-store-record
abort-actor-run
```

The four extras are generic run-management helper tools that come bundled automatically whenever
any actor tool is loaded (confirmed against the `apify-mcp-server` README's own tools-configuration
section, read two turns ago: `call-actor` is "included by default via the actors category," and
these four are its siblings). This doesn't violate the closed-scope intent — none of them can reach
outside the actors you've already authorized — but `MCP_INTEGRATION.md`'s claim that the 28-actor
list is *the entire* tool surface was imprecise. The real surface is your 28 named actors **plus**
these 4 generic run-inspection helpers, which is a materially different (and still correctly
closed) number than 28.

### Real dataset schema validation — actual records, not a schema stub

```json
{
  "uid": "4238",
  "vesselName": "MAR AZUL",
  "sdnType": "Vessel",
  "programs": ["CUBA"],
  "vesselOwner": "Samir de Navegacion S.A.",
  "vesselFlag": "Cuba",
  "record_id": "OFAC-SDN-4238",
  "event_type": "SNAPSHOT_NO_DIFF",
  "scraped_at": "2026-09-17T22:15:30.662Z",
  "is_new": false,
  "source_url": "https://sanctionssearch.ofac.treas.gov/Details.aspx?id=4238"
}
```

This is a real, live OFAC SDN vessel record (verifiable directly against
`sanctionssearch.ofac.treas.gov`), fetched end-to-end through the real MCP wire protocol. The
`event_type: "SNAPSHOT_NO_DIFF"` on both returned records is itself a meaningful, honest
confirmation: this vessel had already been seen in an earlier test run minutes before, so the
fleet's actual delta-engine correctly classified the repeat sighting as unchanged — a live,
unstaged demonstration of the "zero-cost on unchanged runs" mechanism the entire fleet is built
around, working correctly through the MCP layer specifically, not just when called directly against
the Apify API.

## Block 3 — Enterprise onboarding package

Two scripts written to this repo, `connect_mcp.sh` (macOS/Linux/Git Bash) and `connect_mcp.ps1`
(Windows PowerShell). Both:

- Prompt the person running them for **their own** Apify token (hidden input — `read -s` in bash,
  `Read-Host -AsSecureString` in PowerShell), and never contain Stefano's token or any other
  hardcoded secret. This is a deliberate, real difference from Block 1's local setup: Block 1
  configured *this* machine with *this* account's token directly; Block 3's scripts are templates
  for *other people's* machines and *other people's* Apify accounts, so hardcoding a specific
  token into them would be wrong regardless of whose it is.
- Detect whether Claude Code and/or Cursor are actually installed before attempting to configure
  either, and report honestly (not silently) when a target isn't found — matching the same honesty
  standard applied to the Cursor gap in Block 1.
- For Claude Code, shell out to the same real, official `claude mcp add` command used in Block 1,
  rather than reimplementing config-file writing for an app whose real config format this session
  already discovered isn't the simple one originally assumed.
- For Cursor, write the real, correct JSON schema directly, since Cursor doesn't have an equivalent
  safe CLI subcommand to delegate to.

Neither script has been run end-to-end by a second real user as part of this validation pass —
that's the honest limit of what "verification" means for a script whose entire purpose is running
on someone else's machine. What's verified is that every command and file-write logic inside them
is identical to, or a direct generalization of, the exact real commands and schemas already proven
working in Blocks 1 and 2 above.
