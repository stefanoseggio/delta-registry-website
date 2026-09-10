import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { ArchitectureMatrix } from '@/components/ArchitectureMatrix'
import { EconomicEngine } from '@/components/EconomicEngine'
import { IntegrationTerminal } from '@/components/IntegrationTerminal'
import { DeltaEngineDocs } from '@/components/DeltaEngineDocs'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ArchitectureMatrix />
        <EconomicEngine />
        <IntegrationTerminal />
        <DeltaEngineDocs />
      </main>
      <Footer />
    </>
  )
}
