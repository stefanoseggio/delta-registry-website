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

- `app/` — Next.js App Router pages and layouts.
- `components/` — shared React components used across the site.
- `lib/` — shared utilities and data (e.g. actor/pricing metadata rendered on the site).
- `middleware.ts` — edge middleware for the deployed site.

Deployed continuously on Vercel from the `main` branch.

## About Delta Registry

Delta Registry is a pay-per-event regulatory and compliance data infrastructure operation built and operated by **Stefano Seggio** — 24 Apify Actors spanning government procurement, regulatory enforcement, patent/trademark monitoring, and sanctions/compliance screening. Browse the full Actor catalog on the [Apify Store](https://apify.com/stefano_seggio) or [GitHub](https://github.com/stefanoseggio). For enterprise licensing or a custom monitor, connect on [LinkedIn](https://www.linkedin.com/in/stefanoseggio-deltaregistry).
