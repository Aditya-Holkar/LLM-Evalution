import { ThemeProvider } from '#/context/ThemeContext'
import { AppProvider } from '#/context/AppContext'
import HeaderBar from '#/components/HeaderBar'
import ModelCatalog from '#/components/ModelCatalog'
import PromptInput from '#/components/PromptInput'
import MetricsSelector from '#/components/MetricsSelector'
import ComparisonSummary from '#/components/ComparisonSummary'
import PricingCalculator from '#/components/PricingCalculator'
import ChartsPanel from '#/components/ChartsPanel'
import ExportPanel from '#/components/ExportPanel'
import Footer from '#/components/Footer'
import ResultsGrid from '#/components/ResultsGrid'
import PasswordGate from '#/components/PasswordGate'

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen bg-background">
          <PasswordGate />
          <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
            <HeaderBar />
            <ModelCatalog />
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
              <PromptInput />
              <MetricsSelector />
            </div>
            <ResultsGrid />
            <ComparisonSummary />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <PricingCalculator />
              <ChartsPanel />
            </div>
            <ExportPanel />
            <Footer />
          </div>
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}
