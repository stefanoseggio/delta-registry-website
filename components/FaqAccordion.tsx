'use client'

import { useState, type ReactNode } from 'react'
import { ACTORS, ACTOR_COUNT } from '@/lib/actors'
import type { Actor } from '@/lib/types'

// Real actors used as concrete examples below, read straight out of the shared ACTORS data
// contract — never restated by hand — so this component can't drift from lib/actors.ts as the
// fleet changes.
const OUTAGE_EXAMPLE_SLUG = 'uk-hse-enforcement-monitor'
const FINGERPRINT_EXAMPLE_SLUG = 'actor-19-maritime-sanctions-monitor'
const BYOK_EXAMPLE_SLUG = 'kipris-patent-trademark-status-monitor'

function requireActor(slug: string): Actor {
  const actor = ACTORS.find((candidate) => candidate.slug === slug)
  if (!actor) {
    throw new Error(`FaqAccordion: actor "${slug}" is missing from ACTORS — data contract changed.`)
  }
  return actor
}

interface FaqEntry {
  question: string
  answer: ReactNode
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        open ? 'rotate-180 text-cyan-accent' : 'text-muted'
      }`}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function buildFaqEntries(): FaqEntry[] {
  const outageActor = requireActor(OUTAGE_EXAMPLE_SLUG)
  const fingerprintActor = requireActor(FINGERPRINT_EXAMPLE_SLUG)
  const byokActor = requireActor(BYOK_EXAMPLE_SLUG)

  const deltaEnabledActors = ACTORS.filter((actor) => actor.deltaEvents.length > 0)
  const statelessActors = ACTORS.filter((actor) => actor.deltaEvents.length === 0)
  const byokActors = ACTORS.filter((actor) => actor.byok !== 'none')

  return [
    {
      question: 'How does this fleet distinguish an upstream source outage from a real code failure?',
      answer: (
        <>
          <p>
            Every actor&apos;s failure-isolation layer tags a network- or fetch-level failure &mdash; a
            timeout, a 5xx from the source, a DNS failure &mdash; under a distinct error class from an
            internal parsing or logic error inside the actor&apos;s own code. Both land in the same
            dead-letter store on failure, but under different labels, because conflating the two means
            debugging the wrong problem: an outage needs a wait-and-retry, a logic error needs a code fix,
            and treating one as the other wastes the response.
          </p>
          <p className="mt-3">
            This isn&apos;t a hypothetical. {outageActor.title} hit a real multi-day outage on its source
            system in {outageActor.jurisdiction}, and without that separation the early triage read as a
            scraper bug and burned time patching code that was never broken. Tagging outage-class failures
            separately from logic-class failures at the point of capture is now standard practice across
            every actor in the fleet, not a one-off fix limited to that actor.
          </p>
        </>
      ),
    },
    {
      question: 'What data-normalization guarantees does every actor provide?',
      answer: (
        <>
          <p>
            Every one of the {ACTOR_COUNT} actors declares its own delta vocabulary up front &mdash; the
            exact event names it can emit, including an empty list for the actors that don&apos;t track
            state &mdash; so a downstream consumer knows programmatically, before a single run, whether an
            actor supports change detection and what event names to expect if it does.
          </p>
          <p className="mt-3">
            {deltaEnabledActors.length} of the {ACTOR_COUNT} run the shared delta engine: every record gets
            a content fingerprint and a classification against the last run, using the same canonicalized-
            hash method and the same first-seen / changed / terminal event structure regardless of source.{' '}
            {fingerprintActor.title}, for example, classifies every vessel record as one of{' '}
            {fingerprintActor.deltaEvents.map((event, index) => (
              <span key={event}>
                <span className="font-mono text-contrast">{event}</span>
                {index < fingerprintActor.deltaEvents.length - 1 ? ' / ' : ''}
              </span>
            ))}
            , plus an internal no-diff outcome that is never billed. The remaining {statelessActors.length}{' '}
            are single-pass extractors &mdash; there is no previous run to diff against, so there is nothing
            to fingerprint, and they say so rather than faking a NEW event on every record.
          </p>
        </>
      ),
    },
    {
      question: 'What SLA applies?',
      answer: (
        <p>
          None, and this page doesn&apos;t claim one. There is no formal SLA, no contractual uptime
          percentage, and no guaranteed response-time commitment on any actor in this fleet. Support runs
          through the Apify Store issue tracker on each actor&apos;s own page, and the typical response is
          within roughly 48 hours &mdash; a real, historical average, not a promise. This is the same
          support channel and the same honest framing used everywhere else on this site.
        </p>
      ),
    },
    {
      question: 'How does BYOK (bring-your-own-key) work, and who holds the key?',
      answer: (
        <>
          <p>
            {byokActors.length} of the {ACTOR_COUNT} actors involve a third-party key of some kind, split
            between actors that require one to run at all and actors where a key is optional and unlocks
            one enrichment tier or jurisdiction. In every case the mechanism is the same: you supply your
            own key as actor input at run time, that third party bills your account directly for its own
            usage, and the key is never stored by the actor beyond the run, never pooled across customers,
            and never reused for anyone else&apos;s request.
          </p>
          <p className="mt-3">
            {byokActor.title} is the clearest example &mdash; it cannot run at all without one.{' '}
            {byokActor.byokDetail}
          </p>
        </>
      ),
    },
    {
      question: 'Why pay-per-event instead of a subscription?',
      answer: (
        <p>
          Because a subscription bills for access whether or not anything changed, and this fleet only has
          something worth billing when a record is new or different from the last run. There is no minimum
          spend and no seat licensing &mdash; one price per event type covers unlimited concurrent users on
          your own Apify account &mdash; and billing is delta-aware: an unchanged record in delta mode is
          never re-delivered to the dataset and never charged. A one-off small pull is billed at the exact
          same per-event rate as a large one; there is no tier to graduate into.
        </p>
      ),
    },
    {
      question: 'Why 24 separate actors instead of one monolithic scraper?',
      answer: (
        <p>
          Because a single shared codebase means a single shared failure surface. Each of the{' '}
          {ACTOR_COUNT} actors in this fleet is deployed, versioned, priced, and scheduled independently on
          Apify &mdash; so a schema change on one government portal, a rate limit from one source, or an
          outage on one jurisdiction&apos;s system never touches the run of any other actor. You also only
          ever pay for the actors you actually run, on a schedule you control, instead of one bundled price
          for coverage you don&apos;t need.
        </p>
      ),
    },
  ]
}

function FaqItem({
  entry,
  index,
  isOpen,
  onToggle,
}: {
  entry: FaqEntry
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`

  return (
    <div className="rounded-lg border border-border/60 bg-titanium transition hover:border-cyan-accent/40">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="font-sans text-sm font-medium text-contrast sm:text-base">{entry.question}</span>
          <ChevronIcon open={isOpen} />
        </button>
      </h3>
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-muted"
        >
          {entry.answer}
        </div>
      )}
    </div>
  )
}

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const entries = buildFaqEntries()

  return (
    <section id="faq" className="border-t border-border/60 bg-obsidian py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-accent">FAQ</span>
          <h2 className="mt-3 text-3xl font-semibold text-contrast sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Straight answers on how the delta engine, billing, and support actually work across this
            fleet &mdash; sourced from the same {ACTOR_COUNT}-actor data contract as the rest of this page.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {entries.map((entry, index) => (
            <FaqItem
              key={entry.question}
              entry={entry}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
