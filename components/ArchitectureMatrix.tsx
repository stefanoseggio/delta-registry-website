import { ACTORS, ACTOR_COUNT, DOMAINS } from '@/lib/actors'
import type { Actor, PricingEvent } from '@/lib/types'

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

function ActorCard({ actor }: { actor: Actor }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-titanium p-5 transition hover:border-cyan-accent/40">
      <div>
        <h4 className="font-sans text-base font-semibold text-contrast">{actor.title}</h4>
        <p className="mt-1 font-mono text-xs text-muted">{actor.jurisdiction}</p>
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

      <a
        href={actor.storeUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-auto pt-1 text-xs font-medium text-cyan-accent hover:underline"
      >
        View on Apify Store →
      </a>
    </div>
  )
}

export function ArchitectureMatrix() {
  const groups = DOMAINS.map((domain) => ({
    domain,
    actors: ACTORS.filter((actor) => actor.domain === domain),
  }))

  return (
    <section id="architecture" className="bg-obsidian bg-node-grid bg-grid py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-accent">Architecture Matrix</p>
          <h2 className="mt-3 font-sans text-3xl font-bold text-contrast sm:text-4xl">
            {ACTOR_COUNT} actors across {DOMAINS.length} domains
          </h2>
          <p className="mt-4 font-sans text-base text-muted">
            Every actor below is a separately deployed, independently priced Apify pipeline with its own
            data source and its own change-detection events. This is the full fleet as it exists on the
            Apify Store today — not a roadmap.
          </p>
        </div>

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
      </div>
    </section>
  )
}
