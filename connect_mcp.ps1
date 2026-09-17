# Delta Registry - MCP client onboarding script (Windows PowerShell).
#
# Configures a caller's OWN Claude Code and/or Cursor installation to reach the
# closed-scope, 28-actor Delta Registry MCP endpoint. This script never
# contains a real Apify token - it prompts the person running it for THEIR OWN
# token as a SecureString (not echoed to the console), and only decrypts it
# in memory long enough to pass it to 'claude mcp add' or write a local JSON
# file - it is never written to a transcript or log by this script.
#
# Real, verified endpoint and tool-naming convention: see MCP_INTEGRATION.md in
# this repository for how every fact below was checked.

$ErrorActionPreference = "Stop"

$ToolsUrl = "https://mcp.apify.com/?tools=stefano_seggio/actor-18-b2b-lead-magnet,stefano_seggio/actor-19-maritime-sanctions-monitor,stefano_seggio/actor-20-mdb-procurement-monitor,stefano_seggio/actor-21-patent-ip-enforcement-monitor,stefano_seggio/actor-22-drug-safety-recalls-monitor,stefano_seggio/actor-24-clinical-trials-delta-engine,stefano_seggio/australia-grantconnect-monitor,stefano_seggio/cordoba-compras-monitor,stefano_seggio/diario-oficial-cl-monitor,stefano_seggio/entrerios-compras-monitor,stefano_seggio/florida-tenders-monitor,stefano_seggio/mendoza-compras-monitor,stefano_seggio/pba-tenders-monitor,stefano_seggio/page-metadata-extractor,stefano_seggio/salta-compras-monitor,stefano_seggio/santafe-compras-monitor,stefano_seggio/tucuman-compras-monitor,stefano_seggio/uk-hse-enforcement-monitor,stefano_seggio/kipris-patent-trademark-status-monitor,stefano_seggio/singapore-acra-registry-monitor,stefano_seggio/sec-enforcement-litigation-delta-feed,stefano_seggio/ai-crawler-content-signal-permission-monitor,stefano_seggio/aozora-bunko-public-domain-text-feed,stefano_seggio/regione-lombardia-grants-registry-monitor,stefano_seggio/eu-ted-procurement-delta-monitor,stefano_seggio/uk-modern-slavery-statement-registry-monitor,stefano_seggio/emerging-market-sovereign-debt-auction-monitor,stefano_seggio/uae-corporate-registry-monitor"

Write-Host "Delta Registry MCP onboarding"
Write-Host "=============================="
Write-Host "This will configure your own Claude Code and/or Cursor installation to"
Write-Host "reach the 28-actor Delta Registry fleet via Apify's hosted MCP server."
Write-Host "You will be billed on YOUR OWN Apify account for any tool you actually"
Write-Host "call (real, per-event Pay-Per-Event pricing). Nothing is charged just"
Write-Host "for connecting."
Write-Host ""

$SecureToken = Read-Host -AsSecureString -Prompt "Paste your own Apify API token (from Apify Console -> Settings -> Integrations)"
$Bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
$ApifyToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($Bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)

if ([string]::IsNullOrWhiteSpace($ApifyToken)) {
    Write-Error "No token entered - aborting. Nothing was written."
    exit 1
}

$ConfiguredAny = $false

$ClaudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($ClaudeCmd) {
    Write-Host "Claude Code CLI detected - registering via 'claude mcp add' (the official, safe mechanism)."
    try {
        & claude mcp add --transport http --scope user delta-registry $ToolsUrl --header "Authorization: Bearer $ApifyToken" | Out-Null
        Write-Host "Claude Code: configured. Run 'claude mcp get delta-registry' to verify (note: that command DOES print your token in plaintext to your terminal - be mindful of shell history/screen-sharing when you run it)."
        $ConfiguredAny = $true
    } catch {
        Write-Warning "Claude Code registration failed: $_"
    }
} else {
    Write-Host "Claude Code CLI not found on PATH - skipping. Install from https://claude.com/claude-code if you want this integration."
}

$CursorDir = Join-Path $env:USERPROFILE ".cursor"
$CursorInstalled = (Test-Path $CursorDir) -or (Get-Command cursor -ErrorAction SilentlyContinue)
if ($CursorInstalled) {
    if (-not (Test-Path $CursorDir)) { New-Item -ItemType Directory -Path $CursorDir -Force | Out-Null }
    $CursorConfig = Join-Path $CursorDir "mcp.json"
    if (Test-Path $CursorConfig) {
        Write-Host "Cursor config already exists at $CursorConfig - not overwriting it automatically."
        Write-Host "Add this block to its `"mcpServers`" object yourself (shown once, not logged):"
        $Snippet = @{
            delta-registry = @{
                url     = $ToolsUrl
                headers = @{ Authorization = "Bearer $ApifyToken" }
            }
        } | ConvertTo-Json -Depth 5
        Write-Host $Snippet
    } else {
        $Config = @{
            mcpServers = @{
                "delta-registry" = @{
                    url     = $ToolsUrl
                    headers = @{ Authorization = "Bearer $ApifyToken" }
                }
            }
        }
        $Config | ConvertTo-Json -Depth 5 | Set-Content -Path $CursorConfig -Encoding utf8
        Write-Host "Cursor: wrote $CursorConfig. Restart Cursor to load it."
        $ConfiguredAny = $true
    }
} else {
    Write-Host "Cursor not detected on this machine - skipping. See cursor-mcp.json.example in this repo if you install it later."
}

$ApifyToken = $null
[System.GC]::Collect()

if (-not $ConfiguredAny) {
    Write-Warning "Neither Claude Code nor Cursor was detected/configured. No changes were made."
    exit 1
}

Write-Host ""
Write-Host "Done. Restart whichever client(s) you configured to load the new MCP server."
