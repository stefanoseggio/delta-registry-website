import { ACTORS, ACTOR_COUNT } from '@/lib/actors'

interface Step {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Ingestion & Canonicalization',
    description:
      'Every actor normalizes whatever the upstream source hands back — HTML tables, PDFs, XML feeds, JSON APIs — into the same stable field set before anything is compared. A source can restructure its page or reorder its API response and the canonical shape the rest of the pipeline sees does not move.',
  },
  {
    number: '02',
    title: 'SHA-256 Fingerprint Hashing & Memory State Compare',
    description:
      'The monitored fields on every record are hashed with SHA-256 and checked against a persisted, named key-value store that survives across scheduled runs — not the run-scoped state Apify discards the moment a job ends. Each record is classified against what that same actor saw last time: new, changed, or unchanged.',
  },
  {
    number: '03',
    title: 'Zero-Cost Suppression',
    description:
      'A record whose fingerprint matches the last run is never re-delivered to the dataset and never billed. Point an actor at a source where nothing changed and the invoice for that run is a real $0.00 — suppression happens before delivery, not as a refund after the fact.',
  },
]

function StepConnector() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 text-cyan-accent/50 md:block"
    >
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M22 2L30 8L22 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function StepCard({ step, isLast }: { step: Step; isLast: boolean }) {
  return (
    <div className="relative flex flex-col gap-4 rounded-lg border border-border/60 bg-titanium p-6">
      <span className="font-mono text-3xl font-bold text-cyan-accent/25">{step.number}</span>
      <h3 className="font-sans text-lg font-semibold text-contrast">{step.title}</h3>
      <p className="text-sm leading-relaxed text-muted">{step.description}</p>
      {!isLast && <StepConnector />}
    </div>
  )
}

export function HowItWorks() {
  const deltaEnabledCount = ACTORS.filter((actor) => actor.deltaEvents.length > 0).length

  return (
    <section id="how-it-works" className="border-t border-border/60 bg-obsidian py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-accent">How It Works</p>
          <h2 className="mt-3 font-sans text-3xl font-bold text-contrast sm:text-4xl">
            Three steps between a source change and a $0 bill
          </h2>
          <p className="mt-4 font-sans text-base text-muted">
            {deltaEnabledCount} of the {ACTOR_COUNT} actors in this fleet run this exact pipeline on every
            scheduled run: normalize, fingerprint, suppress.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <StepCard key={step.number} step={step} isLast={index === STEPS.length - 1} />
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">
          This is the scannable version. The full fingerprinting code, the cross-run state store, and
          real billing-verification runs against this fleet&apos;s own live actors are documented in{' '}
          <a href="#delta-engine" className="text-cyan-accent hover:underline">
            Infrastructure Telemetry &amp; Delta-Engine Documentation
          </a>{' '}
          below.
        </p>
      </div>
    </section>
  )
}
