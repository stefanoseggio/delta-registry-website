export type ActorCategory = 'BUSINESS' | 'LEAD_GENERATION' | 'NEWS' | 'SEO_TOOLS'

export type ActorDomain =
  | 'Sanctions & Trade Compliance'
  | 'Development Finance Procurement'
  | 'Patent & IP Enforcement'
  | 'Pharma Safety & Clinical Trials'
  | 'Government Registers & Procurement'
  | 'B2B Data Enrichment'
  | 'SEO & Data Pipelines'

export interface PricingEvent {
  eventName: string
  priceUsd: number
  unit: string
}

export interface Actor {
  slug: string
  title: string
  domain: ActorDomain
  category: ActorCategory
  jurisdiction: string
  dataSource: string
  pricing: PricingEvent[]
  deltaEvents: string[]
  storeUrl: string
}
