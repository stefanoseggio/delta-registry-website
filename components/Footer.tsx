import { ACTOR_COUNT } from '@/lib/actors'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-mono text-sm text-contrast">
              DELTA<span className="text-cyan-accent">REGISTRY</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted">
              {ACTOR_COUNT} production data-extraction pipelines on Apify. Built and maintained by an
              independent developer — not a staffed vendor. No formal SLA; issues are handled through
              the Apify Store issue tracker, typically within 48 hours.
            </p>
          </div>
          <div>
            <div className="text-sm font-medium text-contrast">Fleet</div>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href="#architecture" className="hover:text-cyan-accent">
                  All {ACTOR_COUNT} actors
                </a>
              </li>
              <li>
                <a
                  href="https://apify.com/stefano_seggio"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-accent"
                >
                  Apify Store profile
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium text-contrast">Connect</div>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a
                  href="https://github.com/stefanoseggio"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-accent"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://apify.com/stefano_seggio"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-accent"
                >
                  Apify Store
                </a>
              </li>
              <li>
                <a
                  href="https://dev.to/stefanoseggio"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-accent"
                >
                  Dev.to
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/stefanoseggio-deltaregistry"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-accent"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium text-contrast">Honesty notes</div>
            <p className="mt-3 text-sm text-muted">
              This page states real, current pricing and real scope limitations for every actor listed —
              including what each one deliberately does not cover. No customer logos, testimonials, or
              compliance certifications are shown here because none exist yet.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted">
          © {new Date().getFullYear()} Delta Registry. Independent developer, Buenos Aires, Argentina.
        </div>
      </div>
    </footer>
  )
}
