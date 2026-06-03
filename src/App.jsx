import { ThemeProvider } from '#/context/ThemeContext'
import { AppProvider } from '#/context/AppContext'
import HeaderBar from '#/components/HeaderBar'
import ModelCardGrid from '#/components/ModelCardGrid'
import PromptInput from '#/components/PromptInput'
import MetricsSelector from '#/components/MetricsSelector'
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
          <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            <HeaderBar />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-1 order-2 sm:order-1">
                <ModelCardGrid />
              </div>
              <div className="order-3 sm:order-2">
                <PromptInput />
              </div>
              <div className="sm:col-span-2 lg:col-span-1 order-1 sm:order-3">
                <MetricsSelector />
              </div>
            </div>
            <ResultsGrid />
            <ChartsPanel />
            <ExportPanel />
            <Footer />
          </div>
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}
