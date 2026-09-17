import { useState } from 'react'
import { Send, Loader2, Check } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { useEvaluation } from '#/hooks/useEvaluation'
import { MODELS } from '#/config/constants'

const PRIORITIES = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'quality', label: 'Quality' },
  { id: 'speed', label: 'Speed' },
  { id: 'cost', label: 'Cost' },
]

export default function PromptInput() {
  const [prompt, setPrompt] = useState('')
  const [priority, setPriority] = useState('balanced')
  const { selectedModels, selectModel, isEvaluating } = useApp()
  const { evaluate } = useEvaluation()

  const handleEvaluate = () => {
    if (!prompt.trim() || selectedModels.length === 0 || isEvaluating) return
    evaluate(prompt, priority)
  }

  return (
    <section className="bg-card rounded-2xl border border-border p-4 sm:p-5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-bold">LLM Evalution</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-1">Which model is right for your prompt?</h1>
          <p className="text-sm text-muted-foreground mt-1">Run the same prompt across models and get a task-specific recommendation.</p>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEvaluate() }}
          placeholder="Describe what you want the AI to do..."
          className="w-full min-h-[150px] sm:min-h-[180px] px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y text-sm leading-6"
          disabled={isEvaluating}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Models to compare</div>
            <div className="flex flex-wrap gap-2">
              {MODELS.slice(0, 6).map((model) => {
                const selected = selectedModels.includes(model.id)
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => selectModel(model.id)}
                    disabled={isEvaluating}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                  >
                    {selected && <Check className="w-3 h-3 inline mr-1" />}{model.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Optimize for</div>
              <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                {PRIORITIES.map((item) => (
                  <button key={item.id} type="button" onClick={() => setPriority(item.id)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${priority === item.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleEvaluate}
              disabled={!prompt.trim() || selectedModels.length === 0 || isEvaluating}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-sm"
            >
              {isEvaluating ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Send className="w-4 h-4" /> Evaluate</>}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">Tip: Ctrl/Cmd + Enter to evaluate. Failed providers stay failed — no model substitution.</p>
      </div>
    </section>
  )
}
