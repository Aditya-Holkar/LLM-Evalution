import { useState } from 'react'
import { Send, Loader2, Check, ChevronDown } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { useEvaluation } from '#/hooks/useEvaluation'
import { MODELS, PROMPT_TEMPLATES } from '#/config/constants'

const PRIORITIES = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'quality', label: 'Quality' },
  { id: 'speed', label: 'Speed' },
  { id: 'cost', label: 'Cost' },
]

export default function PromptInput() {
  const [prompt, setPrompt] = useState('')
  const [priority, setPriority] = useState('balanced')
  const [showTemplates, setShowTemplates] = useState(true)
  const { selectedModels, selectModel, isEvaluating } = useApp()
  const { evaluate } = useEvaluation()

  const openModels = MODELS.filter((m) => m.provider === 'OpenRouter')
  const hostedModels = MODELS.filter((m) => m.provider === 'Groq')

  const handleEvaluate = () => {
    if (!prompt.trim() || selectedModels.length === 0 || isEvaluating) return
    evaluate(prompt, priority)
  }

  const applyTemplate = (template) => {
    setPrompt(template.prompt)
    setShowTemplates(false)
  }

  return (
    <section className="bg-card rounded-2xl border border-border p-4 sm:p-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-bold">LLM Evalution</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mt-1">Compare hosted + web-hosted open models</h1>
          <p className="text-sm text-muted-foreground mt-1">Test the same prompt across hosted APIs and free/open models served from the web.</p>
        </div>

        <div className="mb-3 rounded-xl border border-border bg-muted/20 p-3">
          <button type="button" onClick={() => setShowTemplates((v) => !v)} className="w-full flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Sample prompt templates <span className="text-xs font-normal text-muted-foreground">(10 types)</span></span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
          {showTemplates && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {PROMPT_TEMPLATES.map((template) => (
                <button key={template.id} type="button" onClick={() => applyTemplate(template)} disabled={isEvaluating} className="text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors">
                  <div className="text-xs font-semibold text-foreground">{template.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Use sample</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleEvaluate() }}
          placeholder="Choose a sample above or enter your own prompt..."
          className="w-full min-h-[150px] sm:min-h-[180px] px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y text-sm leading-6"
          disabled={isEvaluating}
        />

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground">Hosted models</div>
              <div className="text-[10px] text-muted-foreground">API key may be required</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hostedModels.map((model) => {
                const selected = selectedModels.includes(model.id)
                return (
                  <button key={model.id} type="button" onClick={() => selectModel(model.id)} disabled={isEvaluating} title={model.description} className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                    {selected && <Check className="w-3 h-3 inline mr-1" />}{model.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-muted-foreground">Web-hosted open-source / open-weight</div>
              <div className="text-[10px] text-muted-foreground">OpenRouter free endpoints · rate limited</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {openModels.map((model) => {
                const selected = selectedModels.includes(model.id)
                return (
                  <button key={model.id} type="button" onClick={() => selectModel(model.id)} disabled={isEvaluating} title={`${model.country} · ${model.description}`} className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                    {selected && <Check className="w-3 h-3 inline mr-1" />}{model.name} <span className="opacity-60">· {model.country}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
            <button onClick={handleEvaluate} disabled={!prompt.trim() || selectedModels.length === 0 || isEvaluating} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-sm">
              {isEvaluating ? <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</> : <><Send className="w-4 h-4" /> Evaluate</>}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">Tip: Ctrl/Cmd + Enter to evaluate. Free web models are served through OpenRouter and may have rate limits.</p>
      </div>
    </section>
  )
}
