import { MODELS } from '#/config/constants'
import { useApp } from '#/context/AppContext'
import ModelCard from '#/components/ModelCard'

export default function ModelCardGrid() {
  const { selectedModels, isEvaluating, selectModel } = useApp()

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
      <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-3">Available Models</h2>
      <div className="space-y-2 sm:space-y-3 max-h-[420px] sm:max-h-none overflow-y-auto sm:overflow-visible pr-1">
        {MODELS.map((model) => (
          <ModelCard key={model.id} model={model} selected={selectedModels.includes(model.id)} onToggle={selectModel} disabled={isEvaluating} />
        ))}
      </div>
    </div>
  )
}
