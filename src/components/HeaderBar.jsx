import { Gauge, Activity, DollarSign, Infinity } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import ThemeToggle from '#/components/ThemeToggle'

export default function HeaderBar() {
  const { triesRemaining, isUnlocked, results } = useApp()

  const avgLatency = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.metrics?.latency || 0), 0) / results.length).toFixed(1)
    : '--'

  const totalCost = results.length > 0
    ? results.reduce((sum, r) => sum + (r.metrics?.totalCost || 0), 0).toFixed(6)
    : '--'

  const stats = [
    { icon: Gauge, label: 'Tries Left', value: isUnlocked ? <Infinity className="w-4 h-4" /> : triesRemaining },
    { icon: Activity, label: 'Avg Latency', value: typeof avgLatency === 'string' ? avgLatency : `${avgLatency}s` },
    { icon: DollarSign, label: 'Total Cost', value: `$${totalCost}` },
  ]

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-card border border-border rounded-xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-card-foreground">LLM Evaluation Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Compare, Evaluate, and Choose the Best LLM.</p>
      </div>
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-semibold text-card-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
        <ThemeToggle />
      </div>
    </header>
  )
}
