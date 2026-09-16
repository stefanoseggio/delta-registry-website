# Delta Registry — Marketing Website

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

The public marketing site for **Delta Registry** — architecture explainer, pricing overview, and delta-engine internals for the full fleet of pay-per-event Apify Actors. Built with the Next.js App Router, React 18, and Tailwind CSS.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). `npm run build && npm run start` runs the production build; `npm run typecheck` and `npm run lint` run TypeScript and ESLint respectively.

## What's here

- `app/` — Next.js App Router pages and layouts. `app/page.tsx` composes every section
  (`Header`, `Hero`, `ArchitectureMatrix`, `HowItWorks`, `EconomicEngine`, `IntegrationTerminal`,
  `DeltaEngineDocs`, `FaqAccordion`, `Footer`) in render order; there is no other route.
- `components/` — one React component per site section. Sections that need interactivity
  (the fleet filter, the JSON delta-viewer playground, the accordion, the code-language tabs)
  are client components (`'use client'`); everything else renders on the server.
- `lib/` — the site's data contract. `lib/types.ts` defines the `Actor` shape; `lib/actors.ts`
  exports the real `ACTORS` array plus derived constants (`ACTOR_COUNT`, `DOMAINS`,
  `GITHUB_REPO_COUNT`).
- `middleware.ts` — edge middleware for the deployed site.

## Architecture: `lib/actors.ts` as the single source of truth

Every number, price, badge, and filter option rendered anywhere on this site — the hero stat
counters, the fleet catalog cards, the pricing comparison table, the BYOK disclosure, the
integration workbench's actor tabs, the FAQ's live counts — is read from the same `ACTORS` array
in `lib/actors.ts`, never hand-typed a second time in a component. Each `Actor` record carries
`slug`, `title`, `domain`, `jurisdiction`, `dataSource`, `pricing[]` (per-event-type price and
unit), `deltaEvents[]`, `storeUrl`, `githubUrl`, `byok` (`'required' | 'optional' | 'none'`, plus
`byokDetail` when applicable), `updateFrequency`, and `isPublic`.

This is deliberate, not incidental: it means a component can never drift out of sync with the
real fleet, and every price or claim on this marketing site traces back to one file that's
independently re-verified against each actor's own Apify Store listing and README whenever the
fleet changes. When an actor's price changes or a new actor launches, updating `lib/actors.ts` is
the only change needed — every section that references it (filters, cards, comparison tables,
code snippets) updates automatically.

## Security headers & CSP model

`next.config.js` sets standard hardening headers (`X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, a restrictive
`Permissions-Policy`) globally. The Content-Security-Policy is set separately, per-request, in
`middleware.ts` — not as a static header — because a static `script-src 'self'` blocks Next.js's
own inline hydration/bootstrap scripts and breaks the app at runtime. Instead, `middleware.ts`
generates a fresh nonce on every request, threads it to Next.js via the `x-nonce` request header
(read in `app/layout.tsx`), and scopes the CSP to that nonce (`script-src 'self'
'nonce-<value>' 'strict-dynamic'`) rather than falling back to `'unsafe-inline'`, which would
defeat the policy's purpose. `'unsafe-eval'` is included only when `NODE_ENV === 'development'`
(webpack's Fast Refresh needs it) and is never present in the production CSP.

No compliance badges (SOC 2, ISO 27001, etc.) are displayed anywhere on this site — Delta
Registry holds no such certification, and the headers above are genuine engineering hardening,
not a marketing trust signal standing in for one.

## Environment variables

**None required.** This is a fully static-data marketing site — it reads `lib/actors.ts` at
build time and calls no external API, database, or authenticated service at runtime or during
the build. `npm install && npm run dev` (or `npm run build`) works with no `.env` file. The
`APIFY_TOKEN` references visible in this repo are inside display-only code-snippet strings in
`components/IntegrationTerminal.tsx` — example commands shown to site visitors for calling the
Apify API themselves, not a variable this app reads.

Deployed continuously on Vercel from the `main` branch.

## About Delta Registry

Delta Registry is a pay-per-event regulatory and compliance data infrastructure operation built and operated by **Stefano Seggio** — 24 Apify Actors spanning government procurement, regulatory enforcement, patent/trademark monitoring, and sanctions/compliance screening. Browse the full Actor catalog on the [Apify Store](https://apify.com/stefano_seggio) or [GitHub](https://github.com/stefanoseggio). For enterprise licensing or a custom monitor, connect on [LinkedIn](https://www.linkedin.com/in/stefanoseggio-deltaregistry).
