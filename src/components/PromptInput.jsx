import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useApp } from '#/context/AppContext'
import { useEvaluation } from '#/hooks/useEvaluation'

export default function PromptInput() {
  const [prompt, setPrompt] = useState('')
  const { selectedModels, isEvaluating } = useApp()
  const { evaluate } = useEvaluation()

  const handleEvaluate = () => {
    if (!prompt.trim() || selectedModels.length === 0 || isEvaluating) return
    evaluate(prompt)
  }

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border flex flex-col">
      <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-3">Prompt</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt to evaluate the models..."
        className="flex-1 w-full min-h-[100px] sm:min-h-[120px] px-3 sm:px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3 text-sm"
        disabled={isEvaluating}
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {selectedModels.length > 0 ? `${selectedModels.length} model(s) selected` : 'Select at least one model'}
        </span>
        <button
          onClick={handleEvaluate}
          disabled={!prompt.trim() || selectedModels.length === 0 || isEvaluating}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {isEvaluating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
          ) : (
            <><Send className="w-4 h-4" /> Evaluate</>
          )}
        </button>
      </div>
    </div>
  )
}
