import { Check, X as XIcon } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { METRICS, METRIC_IDS } from '#/config/constants'
import { cn } from '#/lib/utils'

const CATEGORIES = ['Speed', 'Tokens', 'Cost', 'Text']

export default function MetricsSelector() {
  const { selectedMetrics, toggleMetric, setAllMetrics } = useApp()
  if (!selectedMetrics) return null

  const allSelected = selectedMetrics.length === METRICS.length

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Metrics</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setAllMetrics(METRIC_IDS)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer',
              allSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            All
          </button>
          <button
            onClick={() => setAllMetrics([])}
            className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            None
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const catMetrics = METRICS.filter((m) => m.category === cat)
          const catAllSelected = catMetrics.every((m) => selectedMetrics.includes(m.id))
          return (
            <div key={cat}>
              <button
                onClick={() => {
                  const ids = catMetrics.map((m) => m.id)
                  setAllMetrics(catAllSelected ? selectedMetrics.filter((id) => !ids.includes(id)) : [...new Set([...selectedMetrics, ...ids])])
                }}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 cursor-pointer hover:text-foreground"
              >
                <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors', catAllSelected && 'bg-primary border-primary')}>
                  {catAllSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                {cat}
              </button>
              <div className="space-y-0.5">
                {catMetrics.map((metric) => {
                  const active = selectedMetrics.includes(metric.id)
                  return (
                    <label
                      key={metric.id}
                      className={cn('flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors text-sm', active && 'bg-accent/50')}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleMetric(metric.id)}
                        className="w-3.5 h-3.5 rounded border-muted-foreground/40 text-primary focus:ring-ring cursor-pointer"
                      />
                      <span className="text-foreground">{metric.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{metric.suffix}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{selectedMetrics.length} of {METRICS.length} metrics selected</p>
    </div>
  )
}
