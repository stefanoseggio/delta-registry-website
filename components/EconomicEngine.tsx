import { ACTORS, ACTOR_COUNT } from '@/lib/actors'
import type { Actor, ByokStatus, PricingEvent } from '@/lib/types'

// This project's own maritime-sanctions actor anchors the comparison below. Its price and delta
// events are read directly from the shared ACTORS data contract — never restated by hand — so this
// component can't drift from lib/actors.ts as the fleet changes.
const MARITIME_SLUG = 'actor-19-maritime-sanctions-monitor'
// Real example of granular, per-event-type pricing within the fleet (used to illustrate the model,
// not to re-litigate pricing already covered in the fleet-wide matrix component).
const GRANULARITY_SLUG = 'uk-hse-enforcement-monitor'

function requireActor(slug: string): Actor {
  const actor = ACTORS.find((candidate) => candidate.slug === slug)
  if (!actor) {
    throw new Error(`EconomicEngine: actor "${slug}" is missing from ACTORS — data contract changed.`)
  }
  return actor
}

// Trims trailing zeros while preserving sub-cent precision (0.0005, 0.00923, ...).
// Only used for prices read out of the ACTORS data contract, never for the hardcoded
// competitor figures below, which are quoted exactly as researched.
function formatPerEventUsd(priceUsd: number): string {
  const trimmed = priceUsd.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return `$${trimmed}`
}

interface ComparisonRow {
  name: string
  source: string
  priceLabel: string
  multiple: string
  scope: string
  isBaseline?: boolean
  href?: string
}

// The four competitor rows and the ComplyAdvantage reference point are real, previously-verified
// figures from this project's own market research (publicly listed Apify Store pricing, plus
// ComplyAdvantage's publicly listed starting subscription price). They are fixed reference data,
// not derived values, and must not be altered or extended with new figures here.
function buildComparisonRows(maritimeActor: Actor): ComparisonRow[] {
  const maritimePricing: PricingEvent | undefined = maritimeActor.pricing[0]
  if (!maritimePricing) {
    throw new Error(`EconomicEngine: "${maritimeActor.slug}" has no pricing entries — data contract changed.`)
  }

  return [
    {
      name: maritimeActor.title,
      source: 'This project — Apify Store',
      priceLabel: `${formatPerEventUsd(maritimePricing.priceUsd)} / record`,
      multiple: 'baseline',
      scope: maritimeActor.dataSource,
      isBaseline: true,
      href: maritimeActor.storeUrl,
    },
    {
      name: 'veska/sanctions-pep-screener',
      source: 'Apify Store',
      priceLabel: '$0.035 / record',
      multiple: '70x higher',
      scope: 'Persons and companies screened against many sanctions and PEP source lists.',
    },
    {
      name: 'lentic_clockss/global-sanctions-screening',
      source: 'Apify Store',
      priceLabel: '$0.003 / record',
      multiple: '6x higher',
      scope:
        'Persons and companies against multiple lists. Buyer must separately obtain and pay for their own OpenSanctions API key.',
    },
    {
      name: 'scrapers_lat/trade-screening-list-scraper',
      source: 'Apify Store',
      priceLabel: '$0.00923 / record',
      multiple: '~18x higher',
      scope: 'Broader 7-list trade and sanctions screen.',
    },
    {
      name: 'ComplyAdvantage',
      source: 'Off-platform — subscription SaaS',
      priceLabel: 'From $99.99 / month',
      multiple: 'no per-event equivalent',
      scope: 'Subscription compliance product. Starting tier covers 100 monitored entities — not sold per record.',
    },
  ]
}

// Actors requiring or offering a customer-supplied third-party API key. Filtered live off the
// ACTORS array — not hand-typed — so this list can't drift out of sync with lib/actors.ts as
// the fleet changes or as byok fields are added, removed, or reclassified.
function getByokActors(): Actor[] {
  return ACTORS.filter((actor) => actor.byok !== 'none')
}

function ByokBadge({ status }: { status: ByokStatus }) {
  if (status === 'required') {
    return (
      <span className="shrink-0 rounded border border-cyan-accent/40 bg-cyan-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyan-accent">
        Required
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded border border-border/60 bg-obsidian px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
      Optional
    </span>
  )
}

export function EconomicEngine() {
  const maritimeActor = requireActor(MARITIME_SLUG)
  const granularityActor = requireActor(GRANULARITY_SLUG)
  const comparisonRows = buildComparisonRows(maritimeActor)
  const byokActors = getByokActors()

  return (
    <section id="economics" className="border-t border-border/60 bg-obsidian py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-accent">Economics</span>
          <h2 className="mt-3 text-3xl font-semibold text-contrast sm:text-4xl">
            Pay-Per-Event Economic Engine
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Every actor in this fleet bills strictly per delivered event — no subscriptions, no seat
            licenses, no minimum spend. In delta mode, a record that hasn&apos;t changed since the last
            run is never re-delivered and never billed. On {maritimeActor.title}, only{' '}
            {maritimeActor.deltaEvents.map((event, index) => (
              <span key={event}>
                <span className="font-mono text-contrast">{event}</span>
                {index < maritimeActor.deltaEvents.length - 1 ? ' / ' : ''}
              </span>
            ))}{' '}
            events generate a charge — an unchanged vessel record costs nothing on the next run.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PrincipleCard
            title="No subscriptions"
            body="Pay for delivered records only. Stop running an actor and the charges stop — nothing recurs in the background."
          />
          <PrincipleCard
            title="No seat licenses"
            body="One price per event type, unlimited concurrent users on your Apify account. Adding teammates costs nothing extra."
          />
          <PrincipleCard
            title="No minimums"
            body="A one-off 12-record pull is billed at the same per-record rate as a 50,000-record run. There's no plan tier to graduate into."
          />
          <PrincipleCard
            title="Delta-aware billing"
            body="An unchanged record in delta mode is never re-delivered to the dataset and never billed — you pay only for what actually changed."
            highlight
          />
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-titanium p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Real example — granular event-type pricing
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {granularityActor.title} prices two event types separately, so buyers only pay for the depth
            of data they actually consume:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {granularityActor.pricing.map((event) => (
              <div
                key={`${event.eventName}-${event.unit}`}
                className="rounded-md border border-border/60 bg-obsidian px-4 py-3"
              >
                <div className="font-mono text-lg text-cyan-accent">{formatPerEventUsd(event.priceUsd)}</div>
                <div className="mt-1 text-xs text-muted">{event.unit}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-muted/70">
                  event: {event.eventName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-semibold text-contrast">How the maritime-sanctions actor compares</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Figures below are publicly listed Apify Store pricing for named competitor actors, gathered
            during this project&apos;s own market research, plus one off-platform subscription reference
            point.
          </p>

          <div className="mt-6 overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-titanium text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">vs. this actor</th>
                  <th className="px-4 py-3 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.name}
                    className={`border-b border-border/60 last:border-b-0 ${
                      row.isBaseline ? 'bg-cyan-accent/5' : 'bg-obsidian'
                    }`}
                  >
                    <td className="px-4 py-4 align-top font-mono text-xs text-contrast">
                      {row.href ? (
                        <a href={row.href} target="_blank" rel="noreferrer" className="hover:text-cyan-accent">
                          {row.name}
                        </a>
                      ) : (
                        row.name
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-muted">{row.source}</td>
                    <td
                      className={`px-4 py-4 align-top font-mono text-sm ${
                        row.isBaseline ? 'text-cyan-accent' : 'text-contrast'
                      }`}
                    >
                      {row.priceLabel}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-muted">{row.multiple}</td>
                    <td className="px-4 py-4 align-top text-xs text-muted">{row.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
            These competitors screen a broader scope — persons and companies against many source lists —
            while this project&apos;s actor performs vessel-specific IMO screening against the OFAC SDN
            vessel list and the UN Security Council Consolidated List. The precise claim is{' '}
            <span className="text-contrast">
              cheapest vessel-specific sanctions screening found on Apify Store
            </span>
            , not the cheapest sanctions screening of any kind.
          </p>

          <a
            href={maritimeActor.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-accent hover:underline"
          >
            See live Store pricing →
          </a>
        </div>

        <div className="mt-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-accent">Cost layering</span>
          <h3 className="mt-3 text-xl font-semibold text-contrast">
            Apify Platform Cost vs. Upstream API Cost
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            The per-event prices in this fleet&apos;s own pricing tables — the ones shown throughout
            this page and on every actor&apos;s Store listing — are 100% of what Delta Registry
            charges. There is no second, hidden layer folded into that number.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Separately, any actor with a BYOK status of{' '}
            <span className="font-mono text-contrast">required</span> or{' '}
            <span className="font-mono text-contrast">optional</span> also depends on a
            third-party API — KIPRIS Plus, Hunter.io, People Data Labs, or the optional EPO
            opposition-data feed — that the customer must hold their own account and key for. That
            third party bills the customer directly, on its own pricing, at whatever rate it sets.
            This fleet never marks that cost up, never pools customer keys across runs, and never
            touches or routes that billing relationship in any way.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-cyan-accent/30 bg-cyan-accent/5 p-5">
              <div className="text-sm font-semibold text-cyan-accent">Delta Registry (Apify Store)</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                The per-event price shown in this fleet&apos;s pricing tables above. Billed by Apify
                on this project&apos;s behalf, per delivered event, exactly as listed on each actor&apos;s
                Store page.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-titanium p-5">
              <div className="text-sm font-semibold text-contrast">Upstream API (BYOK actors only)</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Billed directly by the third-party provider — KIPRIS Plus, Hunter.io, People Data
                Labs, or EPO — to the customer&apos;s own account with that provider. Not collected,
                marked up, or forwarded by this fleet at any point.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-accent">Disclosure</span>
          <h3 className="mt-3 text-xl font-semibold text-contrast">BYOK Disclosure</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {byokActors.length} of the {ACTOR_COUNT} actors in this fleet depend on a customer-supplied
            third-party API key for some or all of their coverage. This list is filtered live from
            this fleet&apos;s own actor data, not hand-maintained, so it cannot drift out of sync as
            actors are added or their BYOK status changes.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byokActors.map((actor) => (
              <div
                key={actor.slug}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-titanium p-5 transition hover:border-cyan-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-sans text-sm font-semibold text-contrast">{actor.title}</h4>
                  <ByokBadge status={actor.byok} />
                </div>
                <p className="text-xs leading-relaxed text-muted">{actor.byokDetail}</p>
                <a
                  href={actor.storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto pt-1 text-xs font-medium text-cyan-accent hover:underline"
                >
                  View on Apify Store →
                </a>
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted">
            Privacy guarantee: every BYOK key belongs exclusively to the customer&apos;s own account
            with that third party. This fleet never stores, pools, or reuses a customer&apos;s key
            across other customers&apos; runs.
          </p>
        </div>
      </div>
    </section>
  )
}

function PrincipleCard({
  title,
  body,
  highlight,
}: {
  title: string
  body: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        highlight ? 'border-cyan-accent/40 bg-cyan-accent/5 shadow-cyan-glow' : 'border-border/60 bg-titanium'
      }`}
    >
      <div className={`text-sm font-semibold ${highlight ? 'text-cyan-accent' : 'text-contrast'}`}>{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}
