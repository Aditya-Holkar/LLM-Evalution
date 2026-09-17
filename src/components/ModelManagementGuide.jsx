import { useMemo, useState } from 'react'
import { Calculator, Code2, DollarSign, Gauge, Globe2, Search, Sparkles, Brain } from 'lucide-react'
import { MODELS, PRICING } from '#/config/constants'

const TASKS = [
  { id: 'build', label: 'Build a project', icon: Code2, description: 'Application architecture, implementation, debugging, and code generation.', primary: ['openai/gpt-5.6-terra', 'openai/gpt-oss-120b'], secondary: ['anthropic/claude-fable-5.1'] },
  { id: 'reason', label: 'Deep reasoning', icon: Brain, description: 'Complex logic, difficult analysis, planning, and multi-step problems.', primary: ['openai/gpt-5.6-sol', 'openai/gpt-oss-120b'], secondary: ['anthropic/claude-fable-5.1'] },
  { id: 'research', label: 'Research', icon: Search, description: 'Long-form knowledge work, synthesis, document analysis, and investigation.', primary: ['anthropic/claude-fable-5.1', 'openai/gpt-5.6-sol'], secondary: ['openai/gpt-oss-120b'] },
  { id: 'finance', label: 'Finance / accounting', icon: Calculator, description: 'Financial analysis, accounting explanations, calculations, and structured review.', primary: ['openai/gpt-5.6-sol', 'anthropic/claude-fable-5.1'], secondary: ['openai/gpt-5.6-terra'] },
  { id: 'fast', label: 'Fast production app', icon: Gauge, description: 'High-volume user interactions where latency and cost matter most.', primary: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'], secondary: ['openai/gpt-5.6-terra'] },
  { id: 'agent', label: 'Agents / tools', icon: Globe2, description: 'Tool use, browser workflows, structured output, and autonomous tasks.', primary: ['openai/gpt-oss-120b', 'openai/gpt-5.6-sol'], secondary: ['anthropic/claude-fable-5.1'] },
]

const getModel = (id) => MODELS.find((model) => model.id === id)
const costLabel = (id) => {
  const price = PRICING[id]
  if (!price) return 'n/a'
  return `$${price.input.toFixed(4)} / $${price.output.toFixed(4)}`
}

export default function ModelManagementGuide() {
  const [taskId, setTaskId] = useState('build')
  const task = useMemo(() => TASKS.find((item) => item.id === taskId) || TASKS[0], [taskId])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5 text-primary" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Model management</p><h2 className="mt-1 text-lg font-bold text-card-foreground">Which model should I use?</h2><p className="text-xs text-muted-foreground mt-1">Choose the workload first. The guide balances capability, speed, and configured token price instead of treating one model as best for everything.</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-5">
        {TASKS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTaskId(id)} className={`rounded-xl border p-3 text-left transition-colors ${taskId === id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40'}`}><Icon className="h-4 w-4 text-primary mb-2" /><span className="text-xs font-semibold text-foreground">{label}</span></button>)}
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4 mb-5">
        <h3 className="font-semibold text-sm text-foreground">{task.label}</h3><p className="text-xs text-muted-foreground mt-1">{task.description}</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
          {task.primary.map((id, index) => { const model = getModel(id); return <div key={id} className="rounded-xl border border-primary/30 bg-primary/5 p-3"><div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-primary">{index === 0 ? 'Primary fit' : 'Strong fit'}</span><span className="text-[10px] text-muted-foreground">{model?.provider}</span></div><p className="mt-1 text-sm font-bold text-foreground">{model?.name}</p><p className="text-xs text-muted-foreground mt-1">{model?.description}</p><div className="flex flex-wrap gap-2 mt-3"><span className="text-[10px] rounded-full bg-muted px-2 py-1">{model?.tags?.[1] || 'General'}</span><span className="text-[10px] rounded-full bg-muted px-2 py-1">{model?.contextWindow} context</span><span className="text-[10px] rounded-full bg-muted px-2 py-1"><DollarSign className="inline h-3 w-3" /> {costLabel(id)} / 1M</span></div></div> })}
        </div>
        <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Also consider:</span> {task.secondary.map((id) => getModel(id)?.name).join(' · ')}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead><tr className="border-b border-border text-muted-foreground"><th className="px-3 py-2 font-semibold">Model</th><th className="px-3 py-2">Provider</th><th className="px-3 py-2">Speed / positioning</th><th className="px-3 py-2">Typical fit</th><th className="px-3 py-2">Input / output $ per 1M</th></tr></thead>
          <tbody>{MODELS.map((model) => <tr key={model.id} className="border-b border-border/60 last:border-0"><td className="px-3 py-2.5 font-semibold text-foreground">{model.name}</td><td className="px-3 py-2.5 text-muted-foreground">{model.provider}</td><td className="px-3 py-2.5 text-muted-foreground">{model.tags?.slice(0, 2).join(' · ')}</td><td className="px-3 py-2.5 text-muted-foreground">{model.description}</td><td className="px-3 py-2.5 font-medium text-foreground">{costLabel(model.id)}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Prices are the configured comparison rates in this dashboard. Actual provider billing can differ by route, cache, plan, or pricing update.</p>
    </section>
  )
}
