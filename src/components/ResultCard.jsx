import { useState } from 'react'
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { METRICS } from '#/config/constants'
import { useApp } from '#/context/AppContext'
import { cn } from '#/lib/utils'

function formatValue(val, format) {
  if (val === 0 || val === undefined || val === null) return '--'
  switch (format) {
    case 's': return `${val.toFixed(2)}s`
    case 'ms': return `${val.toFixed(0)}ms`
    case 'currency': return `$${val.toFixed(6)}`
    case 'ratio': return val.toFixed(2)
    default: return Number(val).toLocaleString()
  }
}

export default function ResultCard({ result }) {
  const { manualVotes, vote, selectedMetrics } = useApp()
  const [expanded, setExpanded] = useState(false)

  const userVote = manualVotes[result.modelId]
  const overallScore = ((result.accuracy + result.clarity + result.completeness) / 3).toFixed(1)
  const activeMetrics = METRICS.filter((m) => selectedMetrics?.includes(m.id))

  if (result.error) {
    return (
      <div className="bg-card p-4 rounded-xl border border-destructive/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h3 className="font-semibold text-card-foreground">{result.modelName}</h3>
        </div>
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">{result.modelName}</h3>
          {result.fallback && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">Fallback</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-base sm:text-lg">⭐</span>
          <span className="font-bold text-sm sm:text-base text-card-foreground">{overallScore}</span>
          <span className="text-muted-foreground text-xs">/10</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {activeMetrics.slice(0, 8).map((metric) => {
          const val = result.metrics?.[metric.id]
          return (
            <div key={metric.id} className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={metric.label}>{metric.label}</p>
              <p className="font-semibold text-xs sm:text-sm text-foreground">{formatValue(val, metric.format)}</p>
            </div>
          )
        })}
        {activeMetrics.length > 8 && (
          <button onClick={() => setExpanded(!expanded)} className="col-span-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-1 cursor-pointer">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : `${activeMetrics.length - 8} more metrics`}
          </button>
        )}
      </div>

      {expanded && activeMetrics.length > 8 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {activeMetrics.slice(8).map((metric) => {
            const val = result.metrics?.[metric.id]
            return (
              <div key={metric.id} className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{metric.label}</p>
                <p className="font-semibold text-xs sm:text-sm text-foreground">{formatValue(val, metric.format)}</p>
              </div>
            )
          })}
        </div>
      )}

      {result.accuracy > 0 && (
        <div className="space-y-1 mb-3">
          {['accuracy', 'clarity', 'completeness'].map((criterion) => {
            const val = result[criterion]
            return (
              <div key={criterion} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 sm:w-24 capitalize">{criterion}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(val / 10) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-foreground w-6 text-right">{val}/10</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="mb-2">
        <p className="text-xs sm:text-sm text-foreground/80 line-clamp-2">{result.text}</p>
        {result.text.length > 200 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline mt-0.5 cursor-pointer">
            {expanded ? 'Show less' : 'Show full response'}
          </button>
        )}
      </div>

      {expanded && result.text.length > 200 && (
        <div className="mb-3 p-3 rounded-lg bg-muted/50 text-xs sm:text-sm text-foreground/80 max-h-48 overflow-y-auto">
          {result.text}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <button onClick={() => vote(result.modelId, userVote === 'up' ? null : 'up')} className={cn('p-1 rounded transition-colors cursor-pointer', userVote === 'up' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground hover:text-green-500')}>
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => vote(result.modelId, userVote === 'down' ? null : 'down')} className={cn('p-1 rounded transition-colors cursor-pointer', userVote === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground hover:text-red-500')}>
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
