import { cn } from '#/lib/utils'

const TAG_COLORS = {
  Fast: 'bg-chart-2/15 text-chart-2',
  'Cost-effective': 'bg-chart-3/15 text-chart-3',
  Versatile: 'bg-chart-4/15 text-chart-4',
  Advanced: 'bg-chart-1/15 text-chart-1',
  Powerful: 'bg-chart-5/15 text-chart-5',
  Enterprise: 'bg-destructive/15 text-destructive',
  Efficient: 'bg-chart-2/15 text-chart-2',
}

const ICONS = { 'GPT-3.5 Turbo': '⚡', 'GPT-4o': '🔮', 'Gemini 2.0 Flash': '🔮', 'Llama 3.3 70B': '🦙', 'DeepSeek V3': '🧠', 'Mistral 7B': '🌬️', 'Qwen 2.5 72B': '🐉' }

export default function ModelCard({ model, selected, onToggle, disabled }) {
  return (
    <button
      onClick={() => !disabled && onToggle(model.id)}
      disabled={disabled}
      className={cn(
        'w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer',
        selected
          ? 'border-primary bg-accent/50 shadow-sm'
          : 'border-border bg-card hover:border-muted-foreground/30',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl sm:text-2xl flex-shrink-0">{ICONS[model.name] || '🤖'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">{model.name}</h3>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{model.contextWindow}</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {model.tags.map((tag) => (
              <span key={tag} className={cn('text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium', TAG_COLORS[tag] || 'bg-muted text-muted-foreground')}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className={cn('w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-1', selected ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
          {selected && (
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}
