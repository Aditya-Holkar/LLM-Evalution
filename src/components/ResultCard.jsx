import { useState } from 'react'
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import { METRICS } from '#/config/constants'
import { useApp } from '#/context/AppContext'
import { cn } from '#/lib/utils'

function formatValue(val, format) {
  if (val === 0 || val === undefined || val === null) return '--'
  switch (format) {
    case 's': return `${val.toFixed(2)}s`
    case 'currency': return `$${val.toFixed(6)}`
    case 'score': return `${Number(val).toFixed(1)}/10`
    default: return Number(val).toLocaleString()
  }
}

export default function ResultCard({ result }) {
  const { manualVotes, vote, selectedMetrics } = useApp()
  const [expanded, setExpanded] = useState(false)
  const userVote = manualVotes[result.modelId]
  const hasAudit = Number(result.metrics?.qualityScore) > 0
  const activeMetrics = METRICS.filter((m) => selectedMetrics?.includes(m.id))

  if (result.error) return <div className="bg-card p-4 rounded-xl border border-destructive/30"><div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-destructive" /><h3 className="font-semibold text-card-foreground">{result.modelName}</h3></div><p className="text-sm text-destructive">{result.error}</p></div>

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">{result.modelName}</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Actual provider response</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0"><span className="text-base sm:text-lg">⭐</span><span className="font-bold text-sm sm:text-base text-card-foreground">{hasAudit ? result.metrics.qualityScore.toFixed(1) : '--'}</span><span className="text-muted-foreground text-xs">/10</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">{activeMetrics.map((metric) => <div key={metric.id} className="text-center p-2 rounded-lg bg-muted/50"><p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={metric.label}>{metric.label}</p><p className="font-semibold text-xs sm:text-sm text-foreground">{formatValue(result.metrics?.[metric.id], metric.format)}</p></div>)}</div>
      {hasAudit && <div className="space-y-1 mb-3">{['accuracy', 'clarity', 'completeness'].map((criterion) => <div key={criterion} className="flex items-center gap-2"><span className="text-xs text-muted-foreground w-20 capitalize">{criterion}</span><div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(result[criterion] / 10) * 100}%` }} /></div><span className="text-xs font-medium w-6 text-right">{result[criterion]}/10</span></div>)}</div>}
      <div className="mb-2"><p className={`text-xs sm:text-sm text-foreground/80 ${expanded ? '' : 'line-clamp-2'}`}>{result.text}</p>{result.text.length > 200 && <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline mt-1 cursor-pointer">{expanded ? 'Show less' : 'Show full response'}</button>}</div>
      <div className="flex items-center gap-2 pt-2 border-t border-border"><span className="text-xs text-muted-foreground">Was this helpful?</span><button onClick={() => vote(result.modelId, userVote === 'up' ? null : 'up')} className={cn('p-1 rounded cursor-pointer', userVote === 'up' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground hover:text-green-500')}><ThumbsUp className="w-3.5 h-3.5" /></button><button onClick={() => vote(result.modelId, userVote === 'down' ? null : 'down')} className={cn('p-1 rounded cursor-pointer', userVote === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground hover:text-red-500')}><ThumbsDown className="w-3.5 h-3.5" /></button></div>
    </div>
  )
}
