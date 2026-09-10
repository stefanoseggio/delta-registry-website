import { ACTORS, ACTOR_COUNT, DOMAINS } from '@/lib/actors'
import type { Actor } from '@/lib/types'

// Joins a list of strings into readable prose ("a, b, and c") without ever
// hardcoding the underlying list — callers pass DOMAINS or similar arrays
// straight from lib/actors so this page can't drift from the real data.
function formatList(items: readonly string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  const last = items[items.length - 1] ?? ''
  return `${items.slice(0, -1).join(', ')}, and ${last}`
}

// One row of the fleet ticker. Every field is read straight off a real Actor
// record — no simulated counters, no "records processed today" style claims.
function TickerRow({ actor }: { actor: Actor }) {
  return (
    <div className="flex shrink-0 items-center gap-3 whitespace-nowrap px-6 py-3 font-mono text-xs">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-accent shadow-cyan-glow" />
      <span className="text-contrast">{actor.title}</span>
      <span className="text-muted/60">/</span>
      <span className="text-muted">{actor.domain}</span>
      <span className="text-muted/60">/</span>
      <span className="text-muted">{actor.jurisdiction}</span>
      {actor.deltaEvents.length > 0 ? (
        <span className="text-cyan-accent/70">[{actor.deltaEvents.join(' · ')}]</span>
      ) : (
        <span className="text-muted/50">[no delta tracking]</span>
      )}
    </div>
  )
}

export function Hero() {
  const domainBreadth = formatList(DOMAINS)

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-obsidian">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-node-grid bg-grid opacity-40 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-accent shadow-cyan-glow" />
          Production fleet &middot; {ACTOR_COUNT} actors deployed on Apify
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-contrast sm:text-5xl md:text-6xl">
          You don&apos;t pay for a crawl.
          <br />
          <span className="text-cyan-accent">You pay for a change.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Delta Registry runs {ACTOR_COUNT} production data-extraction pipelines across{' '}
          {domainBreadth}. Every actor is pay-per-event: a run bills you for the records that are
          actually new, updated, or changed since the last snapshot &mdash; not for the pages it had
          to re-crawl to find them.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="https://apify.com/stefano_seggio"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-cyan-accent px-6 py-3 text-sm font-semibold text-obsidian shadow-cyan-glow transition hover:brightness-110"
          >
            View on Apify Store
          </a>
          <a
            href="#architecture"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-contrast transition hover:border-cyan-accent/60 hover:text-cyan-accent"
          >
            See the fleet architecture
          </a>
        </div>
      </div>

      <div className="relative border-t border-border/60 bg-titanium/60">
        <div className="border-b border-border/60 px-6 py-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          Deployed actors &mdash; title / domain / jurisdiction / delta events
        </div>
        <div className="dr-marquee-viewport group relative flex overflow-hidden py-1">
          <div className="dr-marquee-track flex w-max">
            {ACTORS.map((actor) => (
              <TickerRow key={`first-${actor.slug}`} actor={actor} />
            ))}
            {ACTORS.map((actor) => (
              <TickerRow key={`second-${actor.slug}`} actor={actor} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dr-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .dr-marquee-track {
          animation: dr-marquee 70s linear infinite;
        }
        .dr-marquee-viewport:hover .dr-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .dr-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
