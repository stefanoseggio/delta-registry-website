import type { ReactNode } from 'react'
import { ACTORS, ACTOR_COUNT } from '@/lib/actors'
import type { Actor, PricingEvent } from '@/lib/types'

// The two actors used as the real, previously-run billing-verification cases below. Read
// straight out of the shared ACTORS data contract — never restated by hand — so this
// component can't drift from lib/actors.ts as the fleet changes.
const MARITIME_SLUG = 'actor-19-maritime-sanctions-monitor'
const WORLD_BANK_SLUG = 'actor-20-mdb-procurement-monitor'

function requireActor(slug: string): Actor {
  const actor = ACTORS.find((candidate) => candidate.slug === slug)
  if (!actor) {
    throw new Error(`DeltaEngineDocs: actor "${slug}" is missing from ACTORS — data contract changed.`)
  }
  return actor
}

// Trims trailing zeros while preserving sub-cent precision (0.0005, 0.0025, ...). Only used
// on prices read out of the ACTORS data contract or arithmetic derived from them.
function formatPerEventUsd(priceUsd: number): string {
  const trimmed = priceUsd.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return `$${trimmed}`
}

// Mirrors the pricing-display rule used across this site: a priceUsd of 0 means the exact
// rate was not independently re-verified for display here, so it renders as a link to the
// live Store pricing page — never as "$0.00" or "Free".
function formatRate(event: PricingEvent, storeUrl: string): ReactNode {
  if (event.priceUsd === 0) {
    return (
      <a href={storeUrl} target="_blank" rel="noreferrer" className="text-cyan-accent hover:underline">
        See live Store pricing →
      </a>
    )
  }
  return (
    <>
      <span className="text-contrast">{formatPerEventUsd(event.priceUsd)}</span> / {event.unit}
    </>
  )
}

function DocSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-border/60 py-10 first:border-t-0 first:pt-6 lg:grid-cols-[220px_1fr] lg:gap-10">
      <div>
        <span className="font-mono text-xs text-cyan-accent">{number}</span>
        <h3 className="mt-2 font-sans text-lg font-medium text-contrast">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-titanium">
      <div className="border-b border-border/60 bg-obsidian/60 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-cyan-accent/70">
        {label}
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-contrast/90 md:text-[13px]">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-obsidian px-1.5 py-0.5 font-mono text-xs text-contrast">{children}</code>
  )
}

interface VerificationRun {
  run: string
  result: string
  billed: string
}

interface VerificationCase {
  actor: Actor
  runs: VerificationRun[]
}

export function DeltaEngineDocs() {
  const maritimeActor = requireActor(MARITIME_SLUG)
  const worldBankActor = requireActor(WORLD_BANK_SLUG)
  const maritimeRate = maritimeActor.pricing[0]?.priceUsd ?? 0

  const deltaEnabledActors = ACTORS.filter((actor) => actor.deltaEvents.length > 0)
  const statelessActors = ACTORS.filter((actor) => actor.deltaEvents.length === 0)

  // Live count of how many actors in the fleet actually emit each event name — computed
  // from the real ACTORS array, not hardcoded, so it can't drift as the fleet changes.
  const eventCounts = ACTORS.reduce<Record<string, number>>((counts, actor) => {
    for (const eventName of actor.deltaEvents) {
      counts[eventName] = (counts[eventName] ?? 0) + 1
    }
    return counts
  }, {})

  const eventClasses: { label: string; hint: string; test: (name: string) => boolean }[] = [
    {
      label: 'Arrival',
      hint: 'first time this record has ever been seen',
      test: (name) => name.startsWith('NEW'),
    },
    {
      label: 'Change',
      hint: 'fingerprint differs from the last run',
      test: (name) => ['STATUS_CHANGE', 'UPDATED', 'AMENDED'].includes(name),
    },
    {
      label: 'Terminal',
      hint: 'actor-specific removal or conclusion event',
      test: (name) => ['DELISTED', 'TERMINATED', 'CLOSED'].includes(name),
    },
  ]

  const classifiedEvents = eventClasses.map((eventClass) => ({
    ...eventClass,
    events: Object.entries(eventCounts)
      .filter(([name]) => eventClass.test(name))
      .sort(([a], [b]) => a.localeCompare(b)),
  }))

  // Defensive: if the fleet ever adds a delta event name that doesn't fit the three buckets
  // above, it shows up here instead of silently vanishing from the taxonomy.
  const classifiedNames = new Set(classifiedEvents.flatMap((eventClass) => eventClass.events.map(([name]) => name)))
  const unclassifiedEvents = Object.entries(eventCounts).filter(([name]) => !classifiedNames.has(name))

  const fingerprintSnippet = `function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key])
        return acc
      }, {})
  }
  return value
}

// The bug this replaced: JSON.stringify(obj, Object.keys(obj).sort())
// only sorts the replacer's TOP-LEVEL key list. Nested objects keep
// whatever key order the source happened to send them in, so two
// semantically identical records could hash differently — and a
// STATUS_CHANGE is a billable event. canonicalize() recurses into
// every array and object first, so key order can never affect the
// fingerprint.
const fingerprint = createHash('sha256') // sha1 on a few older actors
  .update(JSON.stringify(canonicalize(monitoredFields)))
  .digest('hex')`

  const stateStoreSnippet = `// Run-scoped — discarded when the run ends, useless for diffing
// across scheduled runs:
//   await Actor.getValue('LAST_SEEN')

// Named, cross-run store — persists between scheduled runs:
const stateStore = await Actor.openKeyValueStore('delta-state-v1')
const lastSeen = await stateStore.getValue(recordKey)

const classification = !lastSeen
  ? 'NEW'
  : lastSeen.fingerprint === fingerprint
    ? 'SNAPSHOT_NO_DIFF' // unchanged — never re-delivered, never billed
    : 'STATUS_CHANGE'    // or an actor-specific event: UPDATED, AMENDED...

await stateStore.setValue(recordKey, { fingerprint, seenAt: Date.now() })`

  const failureSnippet = `process.on('uncaughtException', (err) => captureAndExit(err))
process.on('unhandledRejection', (reason) => captureAndExit(reason))

async function captureAndExit(err) {
  await deadLetterStore.setValue('failure-' + Date.now(), {
    stack: err instanceof Error ? err.stack : String(err),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    durationMs: Date.now() - runStartedAt,
  })
  process.exit(1)
}

// Full-jitter exponential backoff between retries:
function backoffMs(attempt, base, cap) {
  return Math.random() * Math.min(cap, base * Math.pow(2, attempt))
}

// A request that exhausts its retry budget is written here instead
// of being silently dropped from the dataset:
await deadLetterStore.setValue('exhausted-' + recordKey, {
  recordKey: recordKey,
  attempts: MAX_RETRIES,
  lastError: lastError && lastError.message,
})`

  const verificationCases: VerificationCase[] = [
    {
      actor: maritimeActor,
      runs: [
        {
          run: 'Cold run — empty state store',
          result: '5 of 5 real OFAC-listed vessels classified NEW',
          billed: `Charged for all 5 records (${formatPerEventUsd(5 * maritimeRate)} total at ${formatPerEventUsd(
            maritimeRate,
          )}/record)`,
        },
        {
          run: 'Exact repeat run — same input, same state store',
          result: 'All 5 vessels classified SNAPSHOT_NO_DIFF (fingerprint matched the prior run)',
          billed: '$0 charged — 0 chargeable events pushed to the dataset',
        },
        {
          run: 'onlyNew re-run, further into the source list',
          result:
            'The original 5 were correctly skipped; only genuinely new vessels found further down the list were classified NEW',
          billed: 'Billed only for the newly-surfaced vessels — not for the 5 already-seen records',
        },
      ],
    },
    {
      actor: worldBankActor,
      runs: [
        {
          run: 'Cold run — empty state store',
          result: '3 of 3 real procurement records classified NEW',
          billed: 'Charged for all 3 records',
        },
        {
          run: 'Exact repeat run — same input, same state store',
          result: 'The same 3 records classified SNAPSHOT_NO_DIFF (fingerprint matched the prior run)',
          billed: '$0 charged — 0 chargeable events pushed to the dataset',
        },
        {
          run: 'onlyNew=true re-run',
          result: '0 of 3 records delivered — all 3 correctly excluded as already-seen',
          billed: '$0 charged',
        },
      ],
    },
  ]

  return (
    <section id="delta-engine" className="relative border-t border-border/60 bg-obsidian py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-node-grid bg-grid opacity-20"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-accent">
            Telemetry / Delta Engine
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-contrast sm:text-4xl">
            Infrastructure Telemetry &amp; Delta-Engine Documentation
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {deltaEnabledActors.length} of the {ACTOR_COUNT} actors in this fleet run the delta engine
            documented below — persisted state, content fingerprinting, and per-record classification
            against the previous run. The remaining {statelessActors.length} (
            {statelessActors.map((actor, index) => (
              <span key={actor.slug}>
                {index > 0 ? ' and ' : ''}
                <span className="text-contrast">{actor.title}</span>
              </span>
            ))}
            ) are single-pass extractors: there is no previous run to diff against, so there is nothing
            to fingerprint.
          </p>
        </div>

        <div>
          <DocSection number="01" title="State Fingerprinting">
            <p className="text-sm leading-relaxed text-muted">
              Not every tracked field needs the same treatment. Where the monitored fields are flat
              scalars — a vessel&apos;s sanctions programs, a trial&apos;s status string — a direct hash
              over those fields is already deterministic, since the field set and its order are fixed by
              the code, not by whatever order the source happened to return them in. Where a monitored
              field is a genuinely nested object — FDA Orange Book&apos;s per-product patent and
              exclusivity data, for example — a plain hash isn&apos;t safe on its own: sorting only the
              top-level keys leaves a nested object&apos;s own key order unsorted.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              That gap is not hypothetical. An earlier version of this fleet used exactly that
              top-level-only <InlineCode>JSON.stringify(obj, Object.keys(obj).sort())</InlineCode> on a
              nested field, and two semantically identical records could still hash differently depending
              on what order the source API returned a nested object&apos;s keys in — producing false
              STATUS_CHANGE classifications, and a STATUS_CHANGE is a billable event. The fix, used
              specifically where a tracked field is genuinely nested, is the fully recursive canonicalizer
              below — it sorts object keys at every nesting level, not just the top one. Flat-field actors
              hash directly instead; there is no nesting for a recursive step to protect against there.
            </p>
            <CodeBlock label="fingerprint.ts — recursive canonicalization (used for nested fields)" code={fingerprintSnippet} />
          </DocSection>

          <DocSection number="02" title="Cross-Run State Persistence">
            <p className="text-sm leading-relaxed text-muted">
              A fingerprint is only useful if it survives past the run that computed it. Apify&apos;s
              run-scoped <InlineCode>Actor.getValue()</InlineCode> is discarded when the run ends, so
              the delta engine instead opens a <span className="text-contrast">named</span> key-value
              store — one that persists across every scheduled run of that actor, not just the current
              one — and reads and writes the last-seen fingerprint for each record key there.
            </p>
            <CodeBlock label="state-store.ts — named, cross-run key-value store" code={stateStoreSnippet} />
          </DocSection>

          <DocSection number="03" title="Classification">
            <p className="text-sm leading-relaxed text-muted">
              Every record&apos;s current fingerprint is compared against the last-seen fingerprint in
              the named store and classified into one of four outcomes. Three of them are real event
              names drawn live from this fleet&apos;s own deltaEvents lists — grouped below, with a
              count of how many of the {ACTOR_COUNT} actors emit each one. The fourth, the no-diff
              case, is deliberately not a delta event at all.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {classifiedEvents.map((eventClass) => (
                <div key={eventClass.label} className="rounded-lg border border-border/60 bg-titanium p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-contrast">
                    {eventClass.label}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{eventClass.hint}</p>
                  <div className="mt-3 space-y-1.5">
                    {eventClass.events.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="text-cyan-accent">{name}</span>
                        <span className="text-muted">
                          {count} {count === 1 ? 'actor' : 'actors'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-cyan-accent/30 bg-cyan-accent/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-cyan-accent">No diff</div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  fingerprint matches the last run — never re-delivered, never billed
                </p>
                <div className="mt-3 font-mono text-[11px] text-contrast">SNAPSHOT_NO_DIFF</div>
                <p className="mt-2 text-[10px] leading-relaxed text-muted/80">
                  Does not appear in any actor&apos;s deltaEvents list above — it isn&apos;t a delta
                  event, it&apos;s the absence of one.
                </p>
              </div>
            </div>

            {unclassifiedEvents.length > 0 && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-yellow-500">
                  Unclassified event names
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Present in ACTORS but not yet mapped to a class above — flagged here instead of
                  silently dropped.
                </p>
                <div className="mt-3 space-y-1.5">
                  {unclassifiedEvents.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="text-contrast">{name}</span>
                      <span className="text-muted">
                        {count} {count === 1 ? 'actor' : 'actors'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DocSection>

          <DocSection number="04" title="Failure Isolation">
            <p className="text-sm leading-relaxed text-muted">
              A global unhandled-exception handler on <InlineCode>process</InlineCode> catches both{' '}
              <InlineCode>uncaughtException</InlineCode> and <InlineCode>unhandledRejection</InlineCode>{' '}
              before the process exits, and records the stack trace along with memory and run-duration
              telemetry at the moment of failure — so a crash leaves a diagnosable trail instead of a
              silent run failure in the Apify Console.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Individual request retries use full-jitter exponential backoff — a random delay bounded
              by a doubling base and a cap — rather than a fixed retry interval, so a batch of failures
              doesn&apos;t all retry against the source site at the same instant. A request that
              exhausts its retry budget is written to a dead-letter queue — a named key-value store
              recording the failure — instead of being silently dropped from the dataset.
            </p>
            <CodeBlock label="failure-isolation.ts — capture, backoff, dead-letter" code={failureSnippet} />
          </DocSection>
        </div>

        <div className="border-t border-border/60 pt-10">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-cyan-accent">05</span>
            <h3 className="font-sans text-lg font-medium text-contrast">
              Billing Verification — Real Run Results
            </h3>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            The classification logic above only matters if it changes what actually gets billed. These
            are the two most recent verification passes run against this fleet&apos;s own live
            actors — real runs, real data, not simulated figures.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {verificationCases.map((verificationCase) => (
              <div
                key={verificationCase.actor.slug}
                className="flex flex-col rounded-lg border border-border/60 bg-titanium p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-sans text-base font-semibold text-contrast">
                      {verificationCase.actor.title}
                    </h4>
                    <p className="mt-1 font-mono text-xs text-muted">{verificationCase.actor.jurisdiction}</p>
                  </div>
                  <a
                    href={verificationCase.actor.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-cyan-accent hover:underline"
                  >
                    View actor →
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-b border-border/60 pb-4 font-mono text-[11px] text-muted">
                  {verificationCase.actor.pricing.map((event, i) => (
                    <span key={`${verificationCase.actor.slug}-rate-${i}`}>
                      {formatRate(event, verificationCase.actor.storeUrl)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-muted">
                        <th className="pb-2 pr-3 font-medium">Run</th>
                        <th className="pb-2 pr-3 font-medium">Classification result</th>
                        <th className="pb-2 font-medium">Billing impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationCase.runs.map((run) => (
                        <tr key={run.run} className="border-t border-border/40 align-top">
                          <td className="py-3 pr-3 font-mono text-xs text-contrast">{run.run}</td>
                          <td className="py-3 pr-3 text-xs text-muted">{run.result}</td>
                          <td className="py-3 font-mono text-xs text-cyan-accent">{run.billed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted/80">
            {worldBankActor.jurisdiction} — a disclosed scope limit, not a hidden one; see the
            actor&apos;s Store page for the reasoning.
          </p>
        </div>
      </div>
    </section>
  )
}
