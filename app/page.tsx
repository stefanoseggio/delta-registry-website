import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { ArchitectureMatrix } from '@/components/ArchitectureMatrix'
import { HowItWorks } from '@/components/HowItWorks'
import { EconomicEngine } from '@/components/EconomicEngine'
import { IntegrationTerminal } from '@/components/IntegrationTerminal'
import { DeltaEngineDocs } from '@/components/DeltaEngineDocs'
import { FaqAccordion } from '@/components/FaqAccordion'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ArchitectureMatrix />
        <HowItWorks />
        <EconomicEngine />
        <IntegrationTerminal />
        <DeltaEngineDocs />
        <FaqAccordion />
      </main>
      <Footer />
    </>
  )
}
