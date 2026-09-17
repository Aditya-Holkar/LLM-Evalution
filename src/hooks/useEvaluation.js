import { useState, useCallback } from 'react'
import { MODELS } from '../config/constants'
import { callModel, judgeResponses } from '../lib/api'
import { calculateCost } from '../lib/pricing'
import { useApp } from '../context/AppContext'

function computeMetrics(res, modelId) {
  const latency = res.latency || 0
  const inputTokens = res.inputTokens || 0
  const outputTokens = res.outputTokens || 0
  const totalTokens = inputTokens + outputTokens
  const totalCost = calculateCost(modelId, inputTokens, outputTokens)
  const inputCost = calculateCost(modelId, inputTokens, 0)
  const outputCost = calculateCost(modelId, 0, outputTokens)
  return { latency: latency / 1000, msPerOutputToken: outputTokens > 0 ? latency / outputTokens : 0, throughput: latency > 0 ? totalTokens / (latency / 1000) : 0, inputTokens, outputTokens, totalTokens, tokenRatio: inputTokens > 0 ? outputTokens / inputTokens : 0, totalCost, inputCost, outputCost, costPer1kOutput: outputTokens > 0 ? (outputCost / outputTokens) * 1000 : 0, charCount: res.text?.length || 0, wordCount: res.text ? res.text.trim().split(/\s+/).length : 0, outputTokensPerSec: latency > 0 ? outputTokens / (latency / 1000) : 0, qualityScore: 0 }
}

const emptyScores = { accuracy: 0, clarity: 0, completeness: 0, coding: 0, reasoning: 0, research: 0, finance: 0, accounting: 0 }

export function useEvaluation() {
  const { selectedModels, startEvaluation, setResults } = useApp()
  const [perModelStatus, setPerModelStatus] = useState({})

  const evaluate = useCallback(async (prompt) => {
    const modelsToEval = MODELS.filter((m) => selectedModels.includes(m.id))
    if (!modelsToEval.length) return
    startEvaluation()
    setPerModelStatus(Object.fromEntries(modelsToEval.map((m) => [m.id, 'loading'])))

    // Evaluate all selected models concurrently so one slow provider cannot block the comparison.
    const settled = await Promise.allSettled(modelsToEval.map((model) => callModel(model, prompt)))
    const results = settled.map((item, index) => {
      const model = modelsToEval[index]
      if (item.status === 'fulfilled') {
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'success' }))
        const res = item.value
        return { modelId: model.id, modelName: model.name, text: res.text, fallback: !!res.fallback, fallbackModel: res.fallbackModel || null, fallbackReason: res.fallbackReason || null, metrics: computeMetrics(res, model.id), error: null, ...emptyScores }
      }
      setPerModelStatus((prev) => ({ ...prev, [model.id]: 'error' }))
      return { modelId: model.id, modelName: model.name, text: '', fallback: false, fallbackModel: null, metrics: computeMetrics({ latency: 0, inputTokens: 0, outputTokens: 0, text: '' }, model.id), error: item.reason?.message || 'Unknown model error', ...emptyScores }
    })

    const successful = results.filter((r) => !r.error && r.text)
    if (successful.length > 1) {
      const scores = await judgeResponses(successful)
      for (const score of scores) {
        const match = results.find((r) => r.modelName === score.model)
        if (!match) continue
        for (const key of ['accuracy', 'clarity', 'completeness', 'coding', 'reasoning', 'research', 'finance', 'accounting']) match[key] = Number(score[key]) || 0
        match.metrics.qualityScore = Number(((match.accuracy + match.clarity + match.completeness) / 3).toFixed(1))
      }
    }
    setResults(results)
  }, [selectedModels, startEvaluation, setResults])

  return { evaluate, perModelStatus }
}
