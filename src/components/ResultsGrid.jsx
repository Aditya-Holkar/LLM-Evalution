import { useApp } from '#/context/AppContext'
import ResultCard from '#/components/ResultCard'

export default function ResultsGrid() {
  const { results, isEvaluating } = useApp()

  const sorted = [...results].sort((a, b) => {
    const aScore = (a.accuracy + a.clarity + a.completeness) / 3
    const bScore = (b.accuracy + b.clarity + b.completeness) / 3
    return bScore - aScore
  })

  if (results.length === 0 && !isEvaluating) {
    return (
      <div className="bg-card p-8 sm:p-12 rounded-xl border border-border text-center">
        <p className="text-muted-foreground text-base sm:text-lg">Select models and enter a prompt to begin</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">
        Results {results.length > 0 && `(${sorted.length})`}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {isEvaluating && results.length === 0 && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-4 rounded-xl border border-border animate-pulse">
                <div className="h-5 w-32 bg-muted rounded mb-4" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[1, 2, 3, 4].map((j) => <div key={j} className="h-12 bg-muted/50 rounded-lg" />)}
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full" />
                  <div className="h-2 bg-muted rounded-full w-3/4" />
                  <div className="h-2 bg-muted rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </>
        )}
        {sorted.map((result) => <ResultCard key={result.modelId} result={result} />)}
      </div>
    </div>
  )
}
