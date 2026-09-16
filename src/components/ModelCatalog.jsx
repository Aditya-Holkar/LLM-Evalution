import { useMemo, useState } from 'react'
import { Check, Search, SlidersHorizontal } from 'lucide-react'
import { MODELS } from '#/config/constants'
import { useApp } from '#/context/AppContext'

const PROVIDERS = ['All', ...new Set(MODELS.map((m) => m.provider || m.id.split('/')[0]))]

export default function ModelCatalog() {
  const { selectedModels, selectModel, isEvaluating } = useApp()
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState('All')

  const models = useMemo(() => MODELS.filter((model) => {
    const modelProvider = model.provider || model.id.split('/')[0]
    const matchesProvider = provider === 'All' || modelProvider === provider
    const haystack = `${model.name} ${model.description} ${model.tags?.join(' ')}`.toLowerCase()
    return matchesProvider && haystack.includes(query.toLowerCase())
  }), [query, provider])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Model catalog</p>
          <h2 className="mt-1 text-lg font-bold text-card-foreground">Pick models to compare</h2>
          <p className="mt-1 text-xs text-muted-foreground">Search, filter and select multiple models for a side-by-side evaluation.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[24rem]">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-36">
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {models.map((model) => {
          const selected = selectedModels.includes(model.id)
          const providerName = model.provider || model.id.split('/')[0]
          return (
            <button key={model.id} type="button" onClick={() => selectModel(model.id)} disabled={isEvaluating} className={`group text-left rounded-xl border p-3 transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:border-primary/40'} disabled:cursor-not-allowed disabled:opacity-60`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-sm text-card-foreground truncate">{model.name}</span>{selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}</div><p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{providerName} · {model.contextWindow || '—'} context</p></div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{model.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{(model.tags || []).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>)}</div>
            </button>
          )
        })}
      </div>
      {!models.length && <div className="py-8 text-center text-sm text-muted-foreground">No models match your filters.</div>}
    </section>
  )
}
