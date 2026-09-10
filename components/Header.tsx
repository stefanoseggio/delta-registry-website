import Link from 'next/link'
import { ACTOR_COUNT } from '@/lib/actors'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-obsidian/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm tracking-wide text-contrast">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-accent shadow-cyan-glow" />
          DELTA<span className="text-cyan-accent">REGISTRY</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#architecture" className="hover:text-contrast">
            Architecture ({ACTOR_COUNT})
          </a>
          <a href="#economics" className="hover:text-contrast">
            Pricing
          </a>
          <a href="#integration" className="hover:text-contrast">
            Integration
          </a>
          <a href="#delta-engine" className="hover:text-contrast">
            Delta Engine
          </a>
        </nav>
        <a
          href="https://apify.com/stefano_seggio"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-cyan-accent/40 px-4 py-2 text-sm font-medium text-cyan-accent transition hover:bg-cyan-accent/10"
        >
          View on Apify Store
        </a>
      </div>
    </header>
  )
}
