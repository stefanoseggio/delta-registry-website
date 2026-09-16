'use client'

import { useState } from 'react'
import { ACTORS, ACTOR_COUNT, GITHUB_REPO_COUNT } from '@/lib/actors'
import type { Actor } from '@/lib/types'

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

function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-titanium px-5 py-4">
      <div className="font-mono text-2xl font-semibold text-contrast sm:text-3xl">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">{label}</div>
    </div>
  )
}

// The real actor used to drive both example payloads in the Hero Playground below. Its slug,
// event name, and priceUsd/unit are read straight out of the shared ACTORS data contract —
// never restated by hand — so the playground can't drift from lib/actors.ts as the fleet changes.
const PLAYGROUND_SLUG = 'singapore-acra-registry-monitor'

function requirePlaygroundActor(): Actor {
  const actor = ACTORS.find((candidate) => candidate.slug === PLAYGROUND_SLUG)
  if (!actor) {
    throw new Error(`Hero: actor "${PLAYGROUND_SLUG}" is missing from ACTORS — data contract changed.`)
  }
  return actor
}

// Trims trailing zeros while preserving sub-cent precision. Only used on prices read out of
// the ACTORS data contract, matching the same helper used elsewhere on this site.
function formatPerEventUsd(priceUsd: number): string {
  const trimmed = priceUsd.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return `$${trimmed}`
}

function PlaygroundCard({
  label,
  code,
  active,
}: {
  label: string
  code: string
  active: boolean
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-titanium transition ${
        active ? 'border-cyan-accent/60 shadow-cyan-glow' : 'border-border/60 opacity-50'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-border/60 bg-obsidian/60 px-4 py-3">
        <span className="font-mono text-xs text-muted">delta-event.json</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-cyan-accent/70">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-contrast/90 md:text-[13px]">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

type DeltaTab = 'UNCHANGED' | 'STATUS_CHANGE'

function HeroPlayground() {
  const [active, setActive] = useState<DeltaTab>('UNCHANGED')
  const actor = requirePlaygroundActor()
  const statusChangeEvent = actor.pricing[0]
  if (!statusChangeEvent) {
    throw new Error(`Hero: actor "${PLAYGROUND_SLUG}" has no pricing entries — data contract changed.`)
  }

  const unchangedCode = `{
  "actor": "${actor.slug}",
  "record_key": "<UEN>",
  "classification": "SNAPSHOT_NO_DIFF",
  "fingerprint_matched_last_run": true,
  "delivered_to_dataset": false,
  "billed": "$0.00 — unchanged record, never re-delivered"
}`

  const statusChangeCode = `{
  "actor": "${actor.slug}",
  "record_key": "<UEN>",
  "classification": "STATUS_CHANGE",
  "fingerprint_matched_last_run": false,
  "delivered_to_dataset": true,
  "billed": "${formatPerEventUsd(statusChangeEvent.priceUsd)} — ${statusChangeEvent.unit}"
}`

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Hero Playground &mdash; {actor.title} ({actor.jurisdiction})
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={active === 'UNCHANGED'}
            onClick={() => setActive('UNCHANGED')}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition ${
              active === 'UNCHANGED'
                ? 'border-cyan-accent/60 bg-cyan-accent/10 text-cyan-accent'
                : 'border-border text-muted hover:border-cyan-accent/40 hover:text-contrast'
            }`}
          >
            Unchanged
          </button>
          <button
            type="button"
            aria-pressed={active === 'STATUS_CHANGE'}
            onClick={() => setActive('STATUS_CHANGE')}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition ${
              active === 'STATUS_CHANGE'
                ? 'border-cyan-accent/60 bg-cyan-accent/10 text-cyan-accent'
                : 'border-border text-muted hover:border-cyan-accent/40 hover:text-contrast'
            }`}
          >
            Status_change
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PlaygroundCard label="Classification: SNAPSHOT_NO_DIFF" code={unchangedCode} active={active === 'UNCHANGED'} />
        <PlaygroundCard label="Classification: STATUS_CHANGE" code={statusChangeCode} active={active === 'STATUS_CHANGE'} />
      </div>
    </div>
  )
}

export function Hero() {
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

        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-contrast sm:text-5xl md:text-6xl">
          Enterprise Regulatory Intelligence &amp; Delta Engine Feeds
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Automated, fingerprint-verified tracking of SEC, OFAC, ACRA, KIPRIS, and global regulatory
          registries with $0.00 cost on unchanged execution runs.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="https://apify.com/stefano_seggio"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-cyan-accent px-6 py-3 text-sm font-semibold text-obsidian shadow-cyan-glow transition hover:brightness-110"
          >
            Explore {ACTOR_COUNT}-Actor Fleet
          </a>
          <a
            href="https://github.com/stefanoseggio"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-contrast transition hover:border-cyan-accent/60 hover:text-cyan-accent"
          >
            View Open Source Infrastructure
          </a>
        </div>

        <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCounter value={String(ACTOR_COUNT)} label="Public Actors" />
          <StatCounter value={String(GITHUB_REPO_COUNT)} label="Open Repositories" />
          <StatCounter value="$0.00" label="Cost on Unchanged Runs" />
        </div>

        <HeroPlayground />
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
