# langchain-delta-registry

28 pay-per-event regulatory, sanctions, procurement, and corporate-registry monitoring tools for
[LangChain](https://python.langchain.com) agents, backed by
[Apify's hosted MCP gateway](https://mcp.apify.com). Every tool's Pydantic input schema is
generated directly from the underlying Apify actor's own real `.actor/input_schema.json` — never
hand-written, so it can't silently drift from what the actor actually accepts.

## Install

```bash
pip install langchain-delta-registry
```

## Quickstart

```python
import os
os.environ["APIFY_TOKEN"] = "..."  # get one at https://console.apify.com/settings/integrations

from langchain_delta_registry import DELTA_REGISTRY_TOOLS
from langchain.agents import create_agent

agent = create_agent("gpt-4o", tools=DELTA_REGISTRY_TOOLS)
```

Or import a single tool directly, without loading all 28:

```python
from langchain_delta_registry.actor_19_maritime_sanctions_monitor import actor_19_maritime_sanctions_monitor_tool

result = actor_19_maritime_sanctions_monitor_tool.invoke({"vesselNameContains": "ARTAVIL"})
```

## Authentication

Every tool reads `APIFY_TOKEN` from the environment at call time — never hardcoded, never passed
as a constructor argument, never read from a config file. Get a token from the
[Apify Console](https://console.apify.com/settings/integrations). This library does not issue,
broker, or proxy that token in any way; it is sent directly to `api.apify.com` over HTTPS.

## Pricing

Every actor bills strictly per delivered event (pay-per-event) — no subscriptions, no minimum
spend. Unchanged records across runs are never re-billed. See each actor's real, current pricing
on its [Apify Store](https://apify.com/stefano_seggio) page — pricing is not duplicated here to
avoid it going stale relative to the authoritative source.

## Reliability

Every tool call goes through a shared, production-hardened HTTP client
(`langchain_delta_registry._client`): bounded exponential-backoff retry (3 attempts, full jitter)
for transient failures (429, 5xx, network errors), no retry for real 4xx client errors, a 320-second
timeout (Apify's own real cap on `run-sync-get-dataset-items` is 300s), and a structured
`DeltaRegistryAPIError` exception carrying the real HTTP status and response body rather than a
bare `requests` exception.

## The 28 actors

| Tool name | Real Apify actor |
|---|---|
| `actor-18-b2b-lead-magnet` | [B2B Lead Enrichment Engine](https://apify.com/stefano_seggio/actor-18-b2b-lead-magnet) |
| `actor-19-maritime-sanctions-monitor` | [Maritime Sanctions Watchdog](https://apify.com/stefano_seggio/actor-19-maritime-sanctions-monitor) |
| `actor-20-mdb-procurement-monitor` | [World Bank Procurement & Debarment Monitor](https://apify.com/stefano_seggio/actor-20-mdb-procurement-monitor) |
| `actor-21-patent-ip-enforcement-monitor` | [Patent & IP Enforcement Monitor](https://apify.com/stefano_seggio/actor-21-patent-ip-enforcement-monitor) |
| `actor-22-drug-safety-recalls-monitor` | [Drug Safety & Recall Monitor](https://apify.com/stefano_seggio/actor-22-drug-safety-recalls-monitor) |
| `actor-24-clinical-trials-delta-engine` | [Clinical Trial Data Extractor](https://apify.com/stefano_seggio/actor-24-clinical-trials-delta-engine) |
| `ai-crawler-content-signal-permission-monitor` | [AI Crawler Permission Monitor](https://apify.com/stefano_seggio/ai-crawler-content-signal-permission-monitor) |
| `aozora-bunko-public-domain-text-feed` | [Aozora Bunko Public-Domain Feed](https://apify.com/stefano_seggio/aozora-bunko-public-domain-text-feed) |
| `australia-grantconnect-monitor` | [Australian Government Grants Monitor](https://apify.com/stefano_seggio/australia-grantconnect-monitor) |
| `cordoba-compras-monitor` | [Cordoba Government Tenders Monitor](https://apify.com/stefano_seggio/cordoba-compras-monitor) |
| `diario-oficial-cl-monitor` | [Chile Official Gazette Monitor](https://apify.com/stefano_seggio/diario-oficial-cl-monitor) |
| `emerging-market-sovereign-debt-auction-monitor` | [Sovereign Debt Auction Monitor](https://apify.com/stefano_seggio/emerging-market-sovereign-debt-auction-monitor) |
| `entrerios-compras-monitor` | [Entre Rios Government Tenders Monitor](https://apify.com/stefano_seggio/entrerios-compras-monitor) |
| `eu-ted-procurement-delta-monitor` | [EU TED Procurement Monitor](https://apify.com/stefano_seggio/eu-ted-procurement-delta-monitor) |
| `florida-tenders-monitor` | [Florida State Procurement Monitor](https://apify.com/stefano_seggio/florida-tenders-monitor) |
| `kipris-patent-trademark-status-monitor` | [KIPRIS Patent & Trademark Monitor](https://apify.com/stefano_seggio/kipris-patent-trademark-status-monitor) |
| `mendoza-compras-monitor` | [Mendoza Government Tenders Monitor](https://apify.com/stefano_seggio/mendoza-compras-monitor) |
| `page-metadata-extractor` | [Page Metadata Extractor](https://apify.com/stefano_seggio/page-metadata-extractor) |
| `pba-tenders-monitor` | [Buenos Aires Province Tenders Monitor](https://apify.com/stefano_seggio/pba-tenders-monitor) |
| `regione-lombardia-grants-registry-monitor` | [Lombardy Grants & Tenders Monitor](https://apify.com/stefano_seggio/regione-lombardia-grants-registry-monitor) |
| `salta-compras-monitor` | [Salta Government Tenders Monitor](https://apify.com/stefano_seggio/salta-compras-monitor) |
| `santafe-compras-monitor` | [Santa Fe Government Tenders Monitor](https://apify.com/stefano_seggio/santafe-compras-monitor) |
| `sec-enforcement-litigation-delta-feed` | [SEC Enforcement & Litigation Feed](https://apify.com/stefano_seggio/sec-enforcement-litigation-delta-feed) |
| `singapore-acra-registry-monitor` | [Singapore ACRA Registry Monitor](https://apify.com/stefano_seggio/singapore-acra-registry-monitor) |
| `tucuman-compras-monitor` | [Tucuman Government Tenders Monitor](https://apify.com/stefano_seggio/tucuman-compras-monitor) |
| `uae-corporate-registry-monitor` | [UAE Corporate Registry Monitor](https://apify.com/stefano_seggio/uae-corporate-registry-monitor) |
| `uk-hse-enforcement-monitor` | [UK HSE Enforcement Monitor](https://apify.com/stefano_seggio/uk-hse-enforcement-monitor) |
| `uk-modern-slavery-statement-registry-monitor` | [UK Modern Slavery Statement Registry Monitor](https://apify.com/stefano_seggio/uk-modern-slavery-statement-registry-monitor) |

## Also available for

- **MCP** (Model Context Protocol): [`io.github.stefanoseggio/delta-registry`](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.stefanoseggio/delta-registry) on the Official MCP Registry, and [Smithery](https://smithery.ai/servers/stefanoseggio28/delta-registry-mcp).
- **OpenAI, Anthropic, Gemini, LlamaIndex, CrewAI, AG2**: per-actor tool definitions at `https://delta-registry-website.vercel.app/schemas/{actor-slug}/`.

## Source & regeneration

Every file in `src/langchain_delta_registry/` except `_client.py` is generated by
[`lib/schema-generator/langchain-package-generator.ts`](https://github.com/stefanoseggio/delta-registry-website/blob/main/lib/schema-generator/langchain-package-generator.ts)
in the [`delta-registry-website`](https://github.com/stefanoseggio/delta-registry-website)
repository, from each actor's real, live-verified `.actor/input_schema.json`. Do not hand-edit a
generated file — regenerate it instead, or the next regeneration will silently overwrite your
change.

## License

Apache-2.0
