import type { ReactNode } from 'react'
import { ACTORS, ACTOR_COUNT, DOMAINS } from '@/lib/actors'
import type { Actor, PricingEvent } from '@/lib/types'

// The example actor shown in the code snippets below. uk-hse-enforcement-monitor is used
// because it is the fleet's most-established actor. Falls back to the first actor in the
// (real, imported) fleet array if that slug ever moves or is renamed.
const EXAMPLE_ACTOR: Actor =
  ACTORS.find((actor) => actor.slug === 'uk-hse-enforcement-monitor') ?? ACTORS[0]!

type PricingSummary = { label: string; isStoreLink: boolean }

// Mirrors the pricing-display rule used across this site: a priceUsd of 0 means the exact
// rate was not independently re-verified for display here, so it is rendered as a link to
// the live Store pricing page — never as "$0.00" or "Free".
function summarizePricing(pricing: PricingEvent[]): PricingSummary {
  const primary = pricing[0]
  if (!primary) {
    return { label: 'No public per-event pricing on record', isStoreLink: false }
  }
  if (primary.priceUsd === 0) {
    return { label: 'See live Store pricing', isStoreLink: true }
  }
  const extraCount = pricing.length - 1
  const extraLabel = extraCount > 0 ? ` (+${extraCount} more pricing event${extraCount > 1 ? 's' : ''})` : ''
  return { label: `$${primary.priceUsd} ${primary.unit}${extraLabel}`, isStoreLink: false }
}

function TrafficLights() {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
    </span>
  )
}

function TerminalCard({
  filename,
  label,
  children,
  className,
}: {
  filename: string
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border/60 bg-titanium ${className ?? ''}`}>
      <div className="flex items-center gap-3 border-b border-border/60 bg-obsidian/60 px-4 py-3">
        <TrafficLights />
        <span className="font-mono text-xs text-muted">{filename}</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-cyan-accent/70">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-contrast/90 md:text-[13px]">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  )
}

export function IntegrationTerminal() {
  const pythonSnippet = `import os
from apify_client import ApifyClient

client = ApifyClient(os.environ["APIFY_TOKEN"])

run = client.actor("stefano_seggio/${EXAMPLE_ACTOR.slug}").call(run_input={
    # actor-specific fields — see the Store page above for this actor's full input schema
})

for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(item)`

  const restSnippet = `curl -X POST \\
  "https://api.apify.com/v2/acts/stefano_seggio~${EXAMPLE_ACTOR.slug}/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{}'

# Runs the actor synchronously and streams the resulting dataset items straight back —
# no polling required. Swap the slug for any of the ${ACTOR_COUNT} actors below.`

  const webhookSnippet = `{
  "userId": "<yourApifyUserId>",
  "createdAt": "2026-09-09T14:32:07.123Z",
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "eventData": {
    "actorId": "<actorId>",
    "actorRunId": "<actorRunId>"
  },
  "resource": {
    "id": "<actorRunId>",
    "actId": "<actorId>",
    "status": "SUCCEEDED",
    "startedAt": "2026-09-09T14:28:01.000Z",
    "finishedAt": "2026-09-09T14:32:07.000Z",
    "defaultDatasetId": "<datasetId>",
    "defaultKeyValueStoreId": "<keyValueStoreId>"
  }
}

// Illustrative payload shape for the "Run succeeded" webhook event — see Apify's webhook
// docs for the authoritative schema. Configure it per-actor in the Apify Console under
// Actor → Integrations → Webhooks, pointed at a Zapier / Make catch-hook URL or a CRM
// endpoint. That's the real mechanism behind any "CRM integration" — no custom connector.`

  return (
    <section id="integration" className="relative overflow-hidden border-t border-border/60 bg-obsidian py-24">
      <div className="pointer-events-none absolute inset-0 bg-node-grid bg-grid opacity-20" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-widest text-cyan-accent">Integration</div>
          <h2 className="mt-3 text-3xl font-semibold text-contrast md:text-4xl">
            Enterprise Integration Terminal
          </h2>
          <p className="mt-4 text-sm text-muted md:text-base">
            Every one of the {ACTOR_COUNT} actors across {DOMAINS.length} domains is called the same way —
            through the standard Apify API. There is no separate “enterprise” tier, no SSO, and no dedicated
            account manager: this is a solo developer’s real, public API, shown below using{' '}
            <span className="text-contrast">{EXAMPLE_ACTOR.title}</span> ({EXAMPLE_ACTOR.jurisdiction}) as the
            worked example. Any slug in the fleet reference at the bottom of this section drops into the same
            three patterns.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <TerminalCard filename="integrate.py" label="Python — apify_client">
            {pythonSnippet}
          </TerminalCard>
          <TerminalCard filename="run-sync.sh" label="REST — run-sync-get-dataset-items">
            {restSnippet}
          </TerminalCard>
          <TerminalCard
            filename="webhook-payload.json"
            label="Webhook — actor.run.succeeded"
            className="lg:col-span-2"
          >
            {webhookSnippet}
          </TerminalCard>
        </div>

        <p className="mt-6 max-w-3xl text-xs text-muted md:text-sm">
          Support runs through the Apify Store issue tracker on each actor’s page — typically a response within
          ~48 hours, with no formal SLA. That is the real support channel for every actor listed here.
        </p>

        <div className="mt-10 rounded-lg border border-border/60 bg-titanium/40 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-mono text-sm text-contrast">
              Fleet reference — swap in any of the {ACTOR_COUNT} slugs
            </h3>
            <span className="text-xs text-muted">grouped by domain</span>
          </div>
          <div className="mt-4 max-h-96 space-y-6 overflow-y-auto pr-2">
            {DOMAINS.map((domain) => {
              const actorsInDomain = ACTORS.filter((actor) => actor.domain === domain)
              return (
                <div key={domain}>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-cyan-accent/80">
                    {domain}
                  </div>
                  <ul className="mt-2 divide-y divide-border/30">
                    {actorsInDomain.map((actor) => {
                      const pricing = summarizePricing(actor.pricing)
                      return (
                        <li
                          key={actor.slug}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm text-contrast">{actor.title}</div>
                            <code className="font-mono text-xs text-muted">stefano_seggio/{actor.slug}</code>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 text-xs">
                            {pricing.isStoreLink ? (
                              <a
                                href={actor.storeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-accent hover:underline"
                              >
                                {pricing.label} →
                              </a>
                            ) : (
                              <span className="text-muted">{pricing.label}</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
