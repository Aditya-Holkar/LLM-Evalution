import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { METRICS } from '#/config/constants'
import { useApp } from '#/context/AppContext'

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCSV(results) {
  const metrics = METRICS.map((m) => m.id)
  const headers = ['Model', 'Status', 'Score', ...METRICS.map((m) => m.label)]
  const rows = results.map((r) => {
    const score = r.error ? '-' : ((r.accuracy + r.clarity + r.completeness) / 3).toFixed(1)
    const status = r.error ? 'Error' : 'Success'
    const values = metrics.map((m) => {
      if (r.error) return '-'
      const val = r.metrics?.[m]
      if (val === undefined || val === null) return '-'
      const metric = METRICS.find((mm) => mm.id === m)
      switch (metric?.format) {
        case 'currency': return val.toFixed(8)
        case 'ratio':
        case 's': return val.toFixed(4)
        case 'ms': return val.toFixed(2)
        default: return val
      }
    })
    return [r.modelName, status, score, ...values].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

function toJSON(results) {
  return JSON.stringify(results.map((r) => r.error
    ? { model: r.modelName, status: 'error', error: r.error }
    : { model: r.modelName, status: 'success', qualityScore: ((r.accuracy + r.clarity + r.completeness) / 3).toFixed(1), accuracy: r.accuracy, clarity: r.clarity, completeness: r.completeness, metrics: r.metrics }
  ), null, 2)
}

export default function ExportPanel() {
  const { results } = useApp()
  if (results.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Export</h2>
          <p className="text-xs text-muted-foreground">Export evaluation data for all {results.length} model(s)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => downloadFile(toCSV(results), `llm-eval-${Date.now()}.csv`, 'text/csv')} className="flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => downloadFile(toJSON(results), `llm-eval-${Date.now()}.json`, 'application/json')} className="flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium transition-opacity flex items-center justify-center gap-1.5 cursor-pointer">
            <FileJson className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>
    </div>
  )
}
