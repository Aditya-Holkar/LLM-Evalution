import { BarChart3, Code2, Search, Brain, Landmark, Calculator } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { cn } from '#/lib/utils'

const USE_CASES = [
  { id: 'coding', label: 'Coding', icon: Code2 },
  { id: 'reasoning', label: 'Reasoning', icon: Brain },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'finance', label: 'Finance', icon: Landmark },
  { id: 'accounting', label: 'Accounting', icon: Calculator },
]

function rankResults(results, key) {
  return results
    .filter((result) => !result.error && Number(result[key]) > 0)
    .sort((a, b) => Number(b[key]) - Number(a[key]))
}

export default function UseCaseRankings() {
  const { results, isEvaluating } = useApp()

  if (results.length === 0) return null

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-card-foreground">Best model by use case</h2>
          <p className="text-xs text-muted-foreground mt-1">Ranked from the current responses. Scores are 1–10 and are specific to this evaluation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {USE_CASES.map(({ id, label, icon: Icon }) => {
          const ranked = rankResults(results, id)
          return (
            <div key={id} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
              <div className="space-y-2">
                {ranked.length === 0 && <p className="text-xs text-muted-foreground">No score yet</p>}
                {ranked.map((result, index) => {
                  const score = Number(result[id])
                  return (
                    <div key={result.modelId} className={cn('rounded-lg px-2.5 py-2', index === 0 ? 'bg-primary/10' : 'bg-muted/40')}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">#{index + 1}</span>
                        <span className="text-xs font-medium text-foreground truncate flex-1">{result.modelName}</span>
                        <span className="text-xs font-bold text-primary">{score.toFixed(1)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${score * 10}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {isEvaluating && <p className="mt-3 text-xs text-muted-foreground">Updating rankings…</p>}
    </section>
  )
}
