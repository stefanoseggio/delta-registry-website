# Title
There Is No Single API for Government Procurement Data — So We Built One Pipeline Per Portal

# Cover image concept
Same dark obsidian/cyan node-graph visual language as the existing brand banner, but this time the nodes are arranged as eight discrete, unconnected clusters — each a small isolated network — with a single label beneath: "8 portals. 8 formats. 0 combined feeds." The visual point is fragmentation, deliberately not resolved into one clean shape, because that fragmentation is the actual subject of the article.

# Article body

Here's a fact you can verify yourself in under a minute: there is no single feed — no API, no combined portal — covering government procurement across Argentina's provinces, Chile's national gazette, and Florida's state solicitations. Argentina's national COMPR.AR system covers *national* government purchasing only. Each of the country's provinces runs its own separate portal, in its own format, on its own technology stack. Florida runs a fourth, completely independent system. There is no cross-registry aggregation anywhere, at any price.

If your team tracks opportunities or regulatory activity in more than one of these markets, the only way to do it today is to open each portal by hand, on its own schedule, in whatever structure it happens to use. That's not a data problem you can solve with one clever scraper. It's eight separate engineering problems that happen to rhyme.

## Fragmentation, made concrete

Seven Argentine provincial tender monitors — Cordoba, Entre Rios, Mendoza, Buenos Aires Province, Salta, Santa Fe, and Tucuman — plus Florida's MyFloridaMarketPlace, are each a separately built, separately deployed pipeline. They are not templated copies of one scraper with a config swap. The underlying portals genuinely differ:

- Most of the Argentine provincial portals are legacy ASP.NET WebForms applications built around server-side `__VIEWSTATE` postback state, meaning a page's own hidden form fields have to be read and replayed on every request — there is no clean REST endpoint to call.
- Santa Fe is the exception: it runs on the portal's own official JSON API, making it structurally the most reliable of the seven — a real, verifiable difference in data quality between two supposedly-similar sources, not a uniform experience.
- Tucuman's portal serves ISO-8859-1-encoded responses, not UTF-8 — decode it wrong and every accented character in a buyer or organism name silently corrupts.
- Florida's MyFloridaMarketPlace (MFMP VBS) publishes ITB, RFP, ITN, RFI, RSQ, single-source, and intent-to-award notice types, each carrying UNSPSC commodity codes — a completely different taxonomy from anything on the Argentine side.

Treating these as one interchangeable "government tenders" data source would mean picking the lowest common denominator across all eight and losing what's actually valuable in each. This fleet doesn't do that. Every field the source actually publishes — organism, expediente, budget, UNSPSC code, pliego/circular/acta PDF links, whatever the specific portal exposes — is captured, not normalized away.

## The shared architecture underneath the differences

What *is* shared across all eight is the delta engine. Every pipeline persists a fingerprint of each tender's tracked fields (status, budget, key dates) in a named, cross-run key-value store, and classifies every record on every run:

```json
{
  "record_id": "MFMP-ITB-2026-04471",
  "event_type": "AMENDED",
  "scraped_at": "2026-09-08T09:14:02.118Z",
  "is_new": false,
  "source_url": "https://vendor.myfloridamarketplace.com/search/bids/detail/2026-04471",
  "solicitation_type": "ITB",
  "agency": "Florida Department of Transportation",
  "unspsc_codes": ["72141100"],
  "status": "Amended"
}
```

`NEW` for a tender never seen before, `AMENDED`/`UPDATED`/`STATUS_CHANGE` for one whose tracked fields changed, `CLOSED` where the source models a definitive close state. An unchanged tender, by construction, is never re-delivered and never billed — the delta engine isn't a convenience feature, it's the billing mechanism.

## What this actually replaces

Today, tracking opportunities across even three of these eight jurisdictions means three browser tabs, three different navigation patterns, and three separate mental models of what "new" or "closed" means on each site — repeated on whatever cadence matters to your team, indefinitely, by a person. Every pipeline here runs on a schedule instead, and only surfaces what changed.

## Get the data

All nine actors (the eight tender/gazette monitors plus Chile's Diario Oficial) are live and independently priced on the Apify Store — start with whichever jurisdiction is relevant to you:

**https://apify.com/stefano_seggio/florida-tenders-monitor**

Full fleet and service context: **https://www.linkedin.com/in/stefano-seggio-6525b2435/details/services/**

# Metadata package

**Excerpt:**
Argentina's provinces, Chile's national gazette, and Florida's state portal have zero combined coverage anywhere. Here's why that's eight separate engineering problems, not one — and the shared delta-engine architecture that makes tracking all of them practical.

**Hashtags (5):**
#GovTech #ProcurementIntelligence #PublicSector #DataEngineering #GovernmentContracting

**Distribution mechanics:**
- Same rule as the sanctions article: pin under Destacado after publishing, and lead with a native post (2–3 sentences, your own framing) rather than the bare auto-share.
- This one benefits from a follow-up comment thread more than the others — invite replies naming a ninth or tenth jurisdiction readers wish was covered. That's real market signal for what to build next, not just engagement bait.
- Space at least 3–5 days from the sanctions article and the pharma article — same reasoning: a brand-new page publishing three deep-dives in one week reads as a dump, not a cadence.
