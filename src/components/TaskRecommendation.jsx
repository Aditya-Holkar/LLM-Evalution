import { CheckCircle2, Zap, DollarSign, Target } from 'lucide-react'
import { useApp } from '#/context/AppContext'

function formatCost(value) {
  if (!value) return '$0.00'
  if (value < 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(3)}`
}

export default function TaskRecommendation() {
  const { results, isEvaluating } = useApp()
  const meta = results.evaluationMeta
  const recommendation = meta?.recommendation

  if (isEvaluating || !recommendation) return null
  const { task, priority, winner, ranked, reasons } = recommendation

  return (
    <section className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recommendation</p>
            <h2 className="text-xl sm:text-2xl font-bold text-card-foreground mt-1">{task.icon} {task.label} task</h2>
            <p className="text-sm text-muted-foreground mt-1">Based on this prompt, the measured responses, and your {priority} priority.</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground self-start">
            {ranked.length} models compared
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 grid lg:grid-cols-[1.15fr_1fr] gap-5">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary font-bold">Recommended model</p>
              <h3 className="text-lg sm:text-xl font-bold text-card-foreground mt-0.5">{winner.modelName}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {reasons.length ? `Best fit because of ${reasons.join(' and ')}.` : 'Best overall fit from the measured responses.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-lg bg-background border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground">Quality</div>
              <div className="font-semibold text-card-foreground">{winner.quality ? `${winner.quality}/10` : '—'}</div>
            </div>
            <div className="rounded-lg bg-background border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground">Speed</div>
              <div className="font-semibold text-card-foreground">{winner.speed ? `${winner.speed.toFixed(2)}s` : '—'}</div>
            </div>
            <div className="rounded-lg bg-background border border-border p-2.5">
              <div className="text-[11px] text-muted-foreground">Cost</div>
              <div className="font-semibold text-card-foreground">{formatCost(winner.cost)}</div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">How the recommendation was decided</p>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex gap-2"><Target className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>Actual response quality is measured by the judge rather than model reputation.</span></div>
            <div className="flex gap-2"><Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>Response time is included when speed is part of your priority.</span></div>
            <div className="flex gap-2"><DollarSign className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>Measured token usage and configured pricing influence the cost trade-off.</span></div>
          </div>
          {ranked.length > 1 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Other measured fits</p>
              <div className="space-y-2">
                {ranked.slice(1).map((item) => (
                  <div key={item.modelId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-card-foreground truncate">{item.modelName}</span>
                    <span className="text-muted-foreground shrink-0">{item.score}/100 fit</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
