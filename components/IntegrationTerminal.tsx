'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { ACTORS, ACTOR_COUNT, DOMAINS } from '@/lib/actors'
import type { Actor, PricingEvent } from '@/lib/types'

function requireActor(slug: string): Actor {
  const actor = ACTORS.find((candidate) => candidate.slug === slug)
  if (!actor) {
    throw new Error(`IntegrationTerminal: actor "${slug}" is missing from ACTORS — data contract changed.`)
  }
  return actor
}

// The three actors exposed in the interactive workbench below — one per major fleet shape
// (RSS/EDGAR enforcement feed, sanctions-list diffing, a national corporate registry) so the
// generated snippets aren't three near-identical government-tenders actors. Read straight out
// of the shared ACTORS data contract, never restated by hand.
const WORKBENCH_ACTORS: Actor[] = [
  requireActor('sec-enforcement-litigation-delta-feed'),
  requireActor('actor-19-maritime-sanctions-monitor'),
  requireActor('singapore-acra-registry-monitor'),
]

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

// --- Interactive Integration Code Workbench -------------------------------------------------
//
// Each language has exactly one template function below. It interpolates the selected actor's
// real slug/title so the 3 actors x 3 languages = 9 snippets can never drift out of sync with
// lib/actors.ts — there are no hand-written per-actor string literals to fall out of date.

type WorkbenchLanguage = 'curl' | 'python' | 'node'

function buildCurlSnippet(actor: Actor): string {
  return `curl -X POST \\
  "https://api.apify.com/v2/acts/stefano_seggio~${actor.slug}/run-sync-get-dataset-items?token=$APIFY_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{}'

# Runs "${actor.title}" synchronously and streams the resulting dataset items straight back —
# no polling required. Replace the request body with this actor's own input fields, documented
# on its Store page: ${actor.storeUrl}`
}

function buildPythonSnippet(actor: Actor): string {
  return `import os
from apify_client import ApifyClient

client = ApifyClient(os.environ["APIFY_TOKEN"])

run = client.actor("stefano_seggio/${actor.slug}").call(run_input={
    # actor-specific fields — see "${actor.title}" on the Apify Store for its full input schema
})

for item in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(item)`
}

function buildNodeSnippet(actor: Actor): string {
  return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

const run = await client.actor('stefano_seggio/${actor.slug}').call({
    // actor-specific fields — see "${actor.title}" on the Apify Store for its full input schema
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();

items.forEach((item) => {
    console.log(item);
});`
}

interface LanguageTab {
  id: WorkbenchLanguage
  label: string
  fileExtension: string
  terminalLabel: string
  buildSnippet: (actor: Actor) => string
}

const LANGUAGE_TABS: LanguageTab[] = [
  {
    id: 'curl',
    label: 'cURL',
    fileExtension: 'sh',
    terminalLabel: 'REST — run-sync-get-dataset-items',
    buildSnippet: buildCurlSnippet,
  },
  {
    id: 'python',
    label: 'Python',
    fileExtension: 'py',
    terminalLabel: 'Python — apify-client',
    buildSnippet: buildPythonSnippet,
  },
  {
    id: 'node',
    label: 'Node.js',
    fileExtension: 'js',
    terminalLabel: 'Node.js — apify-client',
    buildSnippet: buildNodeSnippet,
  },
]

function IntegrationWorkbench() {
  const [selectedSlug, setSelectedSlug] = useState<string>(WORKBENCH_ACTORS[0]!.slug)
  const [selectedLanguage, setSelectedLanguage] = useState<WorkbenchLanguage>('curl')

  const selectedActor = WORKBENCH_ACTORS.find((actor) => actor.slug === selectedSlug) ?? WORKBENCH_ACTORS[0]!
  const selectedTab = LANGUAGE_TABS.find((tab) => tab.id === selectedLanguage) ?? LANGUAGE_TABS[0]!
  const snippet = selectedTab.buildSnippet(selectedActor)

  return (
    <div className="rounded-lg border border-border/60 bg-titanium/40 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-sm text-contrast">Interactive Integration Code Workbench</h3>
        <span className="text-xs text-muted">3 actors × 3 client languages</span>
      </div>
      <p className="mt-2 max-w-3xl text-xs text-muted md:text-sm">
        Pick an actor and a client language — the snippet updates to that actor&apos;s real slug and is
        copy-pasteable as-is. All three patterns hit the same public Apify API shown throughout this
        section.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Workbench actor">
        {WORKBENCH_ACTORS.map((actor) => {
          const isActive = actor.slug === selectedActor.slug
          return (
            <button
              key={actor.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedSlug(actor.slug)}
              className={`rounded-md border px-3 py-2 text-left transition ${
                isActive
                  ? 'border-cyan-accent/60 bg-cyan-accent/10'
                  : 'border-border/60 bg-obsidian hover:border-cyan-accent/40'
              }`}
            >
              <span
                className={`block font-sans text-xs font-medium ${isActive ? 'text-cyan-accent' : 'text-contrast'}`}
              >
                {actor.title}
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-muted">{actor.jurisdiction}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Workbench language">
        {LANGUAGE_TABS.map((tab) => {
          const isActive = tab.id === selectedLanguage
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedLanguage(tab.id)}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                isActive
                  ? 'border-cyan-accent/60 bg-cyan-accent/10 text-cyan-accent'
                  : 'border-border/60 bg-obsidian text-muted hover:border-cyan-accent/40 hover:text-contrast'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        <TerminalCard
          filename={`integrate.${selectedTab.fileExtension}`}
          label={`${selectedActor.title} — ${selectedTab.terminalLabel}`}
        >
          {snippet}
        </TerminalCard>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted">
        stefano_seggio/{selectedActor.slug} · {selectedActor.jurisdiction} ·{' '}
        <a href={selectedActor.storeUrl} target="_blank" rel="noreferrer" className="text-cyan-accent hover:underline">
          View on Apify Store →
        </a>
      </p>
    </div>
  )
}

// --- Section ------------------------------------------------------------------------------

export function IntegrationTerminal() {
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
            account manager: this is a solo developer’s real, public API. Pick an actor and a language in
            the workbench below to see the exact call, or scroll to the fleet reference for any of the
            other {ACTOR_COUNT - WORKBENCH_ACTORS.length} slugs.
          </p>
        </div>

        <div className="mt-10">
          <IntegrationWorkbench />
        </div>

        <div className="mt-6">
          <TerminalCard filename="webhook-payload.json" label="Webhook — actor.run.succeeded">
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
