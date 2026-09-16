'use client'

import { useMemo, useState } from 'react'
import { ACTORS, ACTOR_COUNT, DOMAINS } from '@/lib/actors'
import type { Actor, ActorDomain, PricingEvent } from '@/lib/types'

// priceUsd values in lib/actors.ts are already the minimal exact decimal literal
// for that price (e.g. 0.00005, 0.002, 0.25) — printing the number as-is is accurate
// and avoids inventing a fixed decimal precision that isn't in the source data.
function formatPrice(priceUsd: number): string {
  return `$${priceUsd}`
}

function PricingLine({ event, storeUrl }: { event: PricingEvent; storeUrl: string }) {
  if (event.priceUsd === 0) {
    return (
      <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
        <span className="text-muted">{event.eventName}</span>
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap text-cyan-accent hover:underline"
        >
          See live Store pricing →
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
      <span className="text-muted">{event.eventName}</span>
      <span className="whitespace-nowrap text-contrast">
        {formatPrice(event.priceUsd)} <span className="text-muted">{event.unit}</span>
      </span>
    </div>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      Live
    </span>
  )
}

function ByokRow({ actor }: { actor: Actor }) {
  if (actor.byok === 'none') return null

  const isRequired = actor.byok === 'required'

  return (
    <div
      className={`rounded border px-2.5 py-1.5 font-mono text-[10px] leading-relaxed ${
        isRequired ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500' : 'border-border bg-obsidian text-muted'
      }`}
    >
      <span className="uppercase tracking-wide">{isRequired ? 'BYOK required' : 'BYOK optional'}</span>
      {actor.byokDetail && (
        <p className={`mt-0.5 normal-case tracking-normal ${isRequired ? 'text-yellow-500/80' : 'text-muted/80'}`}>
          {actor.byokDetail}
        </p>
      )}
    </div>
  )
}

function ActorCard({ actor }: { actor: Actor }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-titanium p-5 transition hover:border-cyan-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-sans text-base font-semibold text-contrast">{actor.title}</h4>
          <p className="mt-1 font-mono text-xs text-muted">{actor.jurisdiction}</p>
        </div>
        {actor.isPublic && <LiveBadge />}
      </div>

      <p className="font-mono text-xs leading-relaxed text-muted">{actor.dataSource}</p>

      <div className="space-y-1.5 border-t border-border pt-3">
        {actor.pricing.map((event, i) => (
          <PricingLine key={`${actor.slug}-price-${i}`} event={event} storeUrl={actor.storeUrl} />
        ))}
      </div>

      {actor.deltaEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actor.deltaEvents.map((event) => (
            <span
              key={event}
              className="rounded border border-cyan-accent/25 bg-cyan-accent/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyan-accent"
            >
              {event}
            </span>
          ))}
        </div>
      )}

      <ByokRow actor={actor} />

      <p className="font-mono text-[10px] leading-relaxed text-muted/70">{actor.updateFrequency}</p>

      <div className="mt-auto flex flex-wrap items-center gap-4 pt-1">
        <a
          href={actor.storeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-cyan-accent hover:underline"
        >
          View on Apify Store →
        </a>
        {actor.githubUrl && (
          <a
            href={actor.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-muted hover:text-cyan-accent hover:underline"
          >
            Source →
          </a>
        )}
      </div>
    </div>
  )
}

const ALL_DOMAINS = 'All' as const
type DomainFilter = typeof ALL_DOMAINS | ActorDomain

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition ${
        active
          ? 'border-cyan-accent/60 bg-cyan-accent/10 text-cyan-accent shadow-cyan-glow'
          : 'border-border text-muted hover:border-cyan-accent/40 hover:text-contrast'
      }`}
    >
      {label}
    </button>
  )
}

export function ArchitectureMatrix() {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>(ALL_DOMAINS)
  const [query, setQuery] = useState('')

  const filteredActors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return ACTORS.filter((actor) => {
      const matchesDomain = domainFilter === ALL_DOMAINS || actor.domain === domainFilter
      const matchesQuery =
        normalizedQuery === '' ||
        actor.title.toLowerCase().includes(normalizedQuery) ||
        actor.jurisdiction.toLowerCase().includes(normalizedQuery)
      return matchesDomain && matchesQuery
    })
  }, [domainFilter, query])

  const groups = DOMAINS.map((domain) => ({
    domain,
    actors: filteredActors.filter((actor) => actor.domain === domain),
  })).filter((group) => group.actors.length > 0)

  return (
    <section id="architecture" className="bg-obsidian bg-node-grid bg-grid py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-accent">
            Dynamic Fleet Catalog &amp; Interactive Sector Matrix
          </p>
          <h2 className="mt-3 font-sans text-3xl font-bold text-contrast sm:text-4xl">
            {ACTOR_COUNT} actors, {DOMAINS.length} sectors, one filter
          </h2>
          <p className="mt-4 font-sans text-base text-muted">
            Every actor below is a separately deployed, independently priced Apify pipeline with its own
            data source and its own change-detection events. This is the full fleet as it exists on the
            Apify Store today — not a roadmap. Filter by sector or search by title and jurisdiction; the
            grid below updates instantly against the real fleet data, no loading state.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-b border-border/60 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill label={ALL_DOMAINS} active={domainFilter === ALL_DOMAINS} onClick={() => setDomainFilter(ALL_DOMAINS)} />
            {DOMAINS.map((domain) => (
              <FilterPill
                key={domain}
                label={domain}
                active={domainFilter === domain}
                onClick={() => setDomainFilter(domain)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 lg:shrink-0">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title or jurisdiction…"
              className="w-full rounded-md border border-border bg-titanium px-4 py-2 font-mono text-xs text-contrast placeholder:text-muted focus:border-cyan-accent/60 focus:outline-none lg:w-72"
            />
            <span className="shrink-0 font-mono text-xs text-muted">
              {filteredActors.length}/{ACTOR_COUNT}
            </span>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="mt-16 font-mono text-sm text-muted">
            No actors match this filter. Try a different sector or search term.
          </p>
        ) : (
          <div className="mt-16 space-y-16">
            {groups.map(({ domain, actors }) => (
              <div key={domain}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                  <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-contrast">
                    {domain}
                  </h3>
                  <span className="font-mono text-xs text-muted">
                    {actors.length} {actors.length === 1 ? 'actor' : 'actors'}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {actors.map((actor) => (
                    <ActorCard key={actor.slug} actor={actor} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
