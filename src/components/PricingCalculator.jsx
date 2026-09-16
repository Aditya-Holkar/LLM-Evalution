import { useMemo, useState } from 'react'
import { Calculator, DollarSign } from 'lucide-react'
import { MODELS, PRICING } from '#/config/constants'

export default function PricingCalculator() {
  const [modelId, setModelId] = useState(MODELS[0].id)
  const [input, setInput] = useState(1000000)
  const [output, setOutput] = useState(500000)

  const model = MODELS.find((m) => m.id === modelId)
  const price = PRICING[modelId] || { input: 0, output: 0 }
  const cost = useMemo(() => (input / 1000) * price.input + (output / 1000) * price.output, [input, output, price])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><Calculator className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Pricing calculator</span></div>
          <h2 className="mt-1 text-lg font-bold text-card-foreground">Estimate your API spend</h2>
          <p className="mt-1 text-xs text-muted-foreground">Compare estimated input and output token costs before choosing a model.</p>
        </div>
        <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><DollarSign className="h-5 w-5 text-primary" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-muted-foreground">Model
          <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">Input tokens
          <input type="number" min="0" value={input} onChange={(e) => setInput(Number(e.target.value) || 0)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">Output tokens
          <input type="number" min="0" value={output} onChange={(e) => setOutput(Number(e.target.value) || 0)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center">
        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Input / 1K</p><p className="mt-1 text-sm font-semibold text-card-foreground">${price.input.toFixed(5)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Output / 1K</p><p className="mt-1 text-sm font-semibold text-card-foreground">${price.output.toFixed(5)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Estimated total</p><p className="mt-1 text-sm font-bold text-primary">${cost.toFixed(4)}</p></div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Rates are the configured estimates in this project for {model?.name}; provider billing can differ.</p>
    </section>
  )
}
