import { Check } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { METRICS, METRIC_IDS } from '#/config/constants'
import { cn } from '#/lib/utils'

export default function MetricsSelector() {
  const { selectedMetrics, toggleMetric, setAllMetrics } = useApp()
  if (!selectedMetrics) return null

  const allSelected = selectedMetrics.length === METRICS.length

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Key metrics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Only the signals that matter when choosing a model.</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setAllMetrics(METRIC_IDS)} className={cn('text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer', allSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-accent')}>All</button>
          <button onClick={() => setAllMetrics([])} className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground hover:bg-accent cursor-pointer">None</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {METRICS.map((metric) => {
          const active = selectedMetrics.includes(metric.id)
          return (
            <label key={metric.id} className={cn('flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-sm border border-transparent', active && 'bg-accent/50 border-border')}>
              <input type="checkbox" checked={active} onChange={() => toggleMetric(metric.id)} className="sr-only" />
              <span className={cn('w-4 h-4 rounded border flex items-center justify-center', active ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
                {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </span>
              <span className="text-foreground">{metric.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">{metric.suffix}</span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{selectedMetrics.length} of {METRICS.length} selected</p>
    </div>
  )
}
