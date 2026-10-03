import { ThemeProvider } from '#/context/ThemeContext'
import { AppProvider } from '#/context/AppContext'
import HeaderBar from '#/components/HeaderBar'
import PromptInput from '#/components/PromptInput'
import TaskRecommendation from '#/components/TaskRecommendation'
import ResultsGrid from '#/components/ResultsGrid'
import Footer from '#/components/Footer'
import PasswordGate from '#/components/PasswordGate'

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="min-h-screen bg-background">
          <PasswordGate />
          <div className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
            <HeaderBar />
            <PromptInput />
            <TaskRecommendation />
            <ResultsGrid />
            <Footer />
          </div>
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}
