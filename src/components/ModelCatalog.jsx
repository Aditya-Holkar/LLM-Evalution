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
    const p = model.provider || model.id.split('/')[0]
    return (provider === 'All' || p === provider) && `${model.name} ${model.description} ${model.tags?.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  }), [query, provider])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Model catalog</p><h2 className="mt-1 text-lg font-bold text-card-foreground">Pick models to compare</h2></div>
        <div className="flex gap-2 sm:min-w-[24rem]">
          <label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
          <label className="relative"><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-8 text-sm outline-none sm:w-36">{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></label>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {models.map((model) => {
          const selected = selectedModels.includes(model.id)
          return <button key={model.id} type="button" onClick={() => selectModel(model.id)} disabled={isEvaluating} className={`text-left rounded-xl border p-3 transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40'} disabled:opacity-60`}>
            <div className="flex items-start gap-2"><span className="font-semibold text-xs text-card-foreground truncate flex-1">{model.name}</span>{selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"><Check className="h-3 w-3" /></span>}</div>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{model.provider} · {model.tags?.[0]}</p>
          </button>
        })}
      </div>
    </section>
  )
}
