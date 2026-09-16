import { BarChart3, Clock3, DollarSign, Gauge, Trophy } from 'lucide-react'
import { MODELS } from '#/config/constants'
import { useApp } from '#/context/AppContext'

function Stat({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-card-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

export default function ComparisonSummary() {
  const { results } = useApp()
  if (!results.length) return null

  const successful = results.filter((r) => !r.error)
  const winner = [...successful].sort((a, b) => {
    const scoreA = (a.accuracy + a.clarity + a.completeness) / 3
    const scoreB = (b.accuracy + b.clarity + b.completeness) / 3
    return scoreB - scoreA
  })[0]
  const fastest = [...successful].sort((a, b) => a.metrics.latency - b.metrics.latency)[0]
  const cheapest = [...successful].sort((a, b) => a.metrics.totalCost - b.metrics.totalCost)[0]
  const highestThroughput = [...successful].sort((a, b) => b.metrics.outputTokensPerSec - a.metrics.outputTokensPerSec)[0]
  const selected = MODELS.filter((m) => results.some((r) => r.modelId === m.id)).length

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Comparison</p>
          <h2 className="text-lg font-bold text-card-foreground">Your model snapshot</h2>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{selected} models tested</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Trophy} label="Quality" value={winner ? `${((winner.accuracy + winner.clarity + winner.completeness) / 3).toFixed(1)}/10` : '--'} detail={winner?.modelName || 'No score yet'} />
        <Stat icon={Clock3} label="Fastest" value={fastest ? `${fastest.metrics.latency.toFixed(2)}s` : '--'} detail={fastest?.modelName || 'No result'} />
        <Stat icon={DollarSign} label="Lowest cost" value={cheapest ? `$${cheapest.metrics.totalCost.toFixed(5)}` : '--'} detail={cheapest?.modelName || 'No result'} />
        <Stat icon={Gauge} label="Throughput" value={highestThroughput ? `${highestThroughput.metrics.outputTokensPerSec.toFixed(1)}/s` : '--'} detail={highestThroughput?.modelName || 'No result'} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">Quality breakdown</span>
        </div>
        <div className="space-y-3">
          {successful.map((result) => {
            const score = (result.accuracy + result.clarity + result.completeness) / 3
            return (
              <div key={result.modelId} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
                <span className="truncate text-xs text-muted-foreground">{result.modelName}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, score * 10))}%` }} />
                </div>
                <span className="text-right text-xs font-semibold text-card-foreground">{score.toFixed(1)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
