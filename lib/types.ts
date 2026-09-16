export type ActorCategory = 'BUSINESS' | 'LEAD_GENERATION' | 'NEWS' | 'SEO_TOOLS'

export type ActorDomain =
  | 'Sanctions & Trade Compliance'
  | 'Development Finance Procurement'
  | 'Patent & IP Enforcement'
  | 'Pharma Safety & Clinical Trials'
  | 'Government Registers & Procurement'
  | 'B2B Data Enrichment'
  | 'SEO & Data Pipelines'
  | 'Corporate Registries'
  | 'Securities & Financial Enforcement'
  | 'AI Crawler & Content Governance'
  | 'Digital Archives & Publishing'

export interface PricingEvent {
  eventName: string
  priceUsd: number
  unit: string
}

// 'required': the actor cannot run without a customer-supplied third-party key.
// 'optional': a customer key unlocks a specific enrichment tier/jurisdiction; the actor
// runs without one. 'none': no third-party key exists anywhere in the actor's input schema.
export type ByokStatus = 'required' | 'optional' | 'none'

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
  githubUrl?: string
  byok: ByokStatus
  byokDetail?: string
  // Every actor in this fleet runs on Apify's own Scheduler — there is no fixed operator-side
  // cadence to report, so this field states that honestly instead of inventing a false "every
  // N hours" figure per actor.
  updateFrequency: string
  isPublic: boolean
}
