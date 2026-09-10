# Title
FDA and EMA Publish Safety Alerts Separately. Pharmacovigilance Teams Shouldn't Have to Reconcile Them by Hand.

# Cover image concept
Same dark obsidian/cyan visual system. Two labeled source nodes — "openFDA" and "EMA DHPC" — each with its own thin line converging into a single unified node labeled "one stream, jurisdiction-tagged." A small badge icon beside the unified node representing the mandatory disclaimer field, rendered as a literal small tag/label element rather than an afterthought — visually signaling that data-integrity labeling is part of the product, not a legal footnote bolted on.

# Article body

Ask a pharmacovigilance or regulatory affairs team how they track FDA recalls and EMA DHPC safety alerts on products — or a competitor's products — that touch both the US and EU, and the honest answer is usually: two separate checks, on two separate schedules, reconciled by a person. openFDA and the EMA's DHPC feed are both real, public, queryable sources. Neither talks to the other. A recall in one jurisdiction that has a corresponding signal in the other is a match your team has to notice manually, which means it either gets missed or gets caught late — and in pharmacovigilance, "late" has a real cost.

## One stream, not two half-solutions

This pipeline combines the FDA's openFDA drug enforcement (recall) API and the EMA's DHPC safety-alert feed into a single dataset stream, with every record explicitly tagged by jurisdiction and issuing agency:

```json
{
  "record_id": "FDA-ENF-2026-Q3-08841",
  "event_type": "NEW",
  "scraped_at": "2026-09-07T11:20:44.902Z",
  "is_new": true,
  "source_url": "https://api.fda.gov/drug/enforcement.json",
  "jurisdiction": "US",
  "issuing_agency": "FDA",
  "product_description": "Example Tablet 20mg, Lot #EX2026-04",
  "recall_reason": "Labeling: Incorrect or Missing Expiration Date",
  "classification": "Class II",
  "regulatoryDataDisclaimer": "This record reflects data as published by the issuing regulatory agency at the time of extraction and does not constitute regulatory or medical advice."
}
```

That disclaimer field is not boilerplate added to limit liability after the fact — it's on every single record, deliberately, because a pharmacovigilance dataset that looks more authoritative than its source actually is constitutes a real risk in this domain. Structuring the data cleanly and being honest about its provenance are the same design decision here, not a tradeoff.

## Delta tracking on a domain that's mostly one-shot events

A recall notice, once issued, doesn't typically get "updated" the way a government tender's status does — but a domain that's mostly `NEW` events still benefits from the same underlying discipline: a named, cross-run key-value store tracks what's already been delivered, so a scheduled run never re-surfaces a recall your team has already seen and triaged. The pipeline shares its reliability architecture with the rest of the fleet: full-jitter exponential backoff on retries (honoring a source's `Retry-After` header, in both seconds and HTTP-date form), a dead-letter queue for exhausted retries instead of silent data loss, and a process-level exception handler that captures failure telemetry before exit rather than leaving a gap in a compliance-relevant log with no record of why.

## Auditability as a design constraint, not a report you generate afterward

Every record carries `scraped_at`, `source_url`, and `is_new` alongside the substantive fields — enough for a team to answer "when did we first see this, and where does it actually come from" without reconstructing that from logs after the fact. That's the difference between a dataset you can hand to a compliance reviewer and one you have to caveat.

## What it costs

**$0.001 per delivered record**, pay-per-event, no subscription. If your team is checking two sources by hand today, or paying for a platform that bundles this one workflow into a far larger (and more expensive) suite, the honest question is whether that bundle is actually buying you more than this narrower tool does for this specific job.

## Get the data

Live on the Apify Store: **https://apify.com/stefano_seggio/actor-22-drug-safety-recalls-monitor**

Full service context: **https://www.linkedin.com/in/stefano-seggio-6525b2435/details/services/**

# Metadata package

**Excerpt:**
FDA and EMA safety alerts are two separate feeds, checked separately, reconciled by hand. Here's a pipeline that combines them into one jurisdiction-tagged stream — and why the disclaimer on every record is a feature, not fine print.

**Hashtags (5):**
#Pharmacovigilance #RegulatoryAffairs #DrugSafety #LifeSciences #DataEngineering

**Distribution mechanics:**
- Same publish pattern: pin to Destacado, lead with a native post framing your own take rather than the bare share card.
- This is the most sensitive-domain article of the three — resist the urge to add urgency language ("don't miss a recall!") that reads as fear-based marketing in a regulated-industry audience. The anti-hype, engineering-forward tone in the body above is deliberate; keep the accompanying post in the same register.
- Publish this one last of the three, after the sanctions and procurement articles have established some page history — pharma/life-sciences readers are typically more skeptical of a brand-new, unproven account than a general data-engineering audience.
