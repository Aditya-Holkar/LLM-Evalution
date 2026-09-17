import { useState, useCallback } from 'react'
import { MODELS } from '../config/constants'
import { callModel, judgeResponses } from '../lib/api'
import { calculateCost } from '../lib/pricing'
import { useApp } from '../context/AppContext'

function computeMetrics(res, modelId) {
  const latency = res.latency
  const inputTokens = res.inputTokens
  const outputTokens = res.outputTokens
  const totalTokens = inputTokens + outputTokens
  const totalCost = calculateCost(modelId, inputTokens, outputTokens)
  const inputCost = calculateCost(modelId, inputTokens, 0)
  const outputCost = calculateCost(modelId, 0, outputTokens)
  return {
    latency: latency / 1000,
    msPerOutputToken: outputTokens > 0 ? latency / outputTokens : 0,
    throughput: latency > 0 ? totalTokens / (latency / 1000) : 0,
    inputTokens, outputTokens, totalTokens,
    tokenRatio: inputTokens > 0 ? outputTokens / inputTokens : 0,
    totalCost, inputCost, outputCost,
    costPer1kOutput: outputTokens > 0 ? (outputCost / outputTokens) * 1000 : 0,
    charCount: res.text.length,
    wordCount: res.text ? res.text.trim().split(/\s+/).length : 0,
    outputTokensPerSec: latency > 0 ? outputTokens / (latency / 1000) : 0,
  }
}

const emptyScores = {
  accuracy: 0, clarity: 0, completeness: 0,
  coding: 0, reasoning: 0, research: 0, finance: 0, accounting: 0,
}

export function useEvaluation() {
  const { selectedModels, startEvaluation, setResults } = useApp()
  const [perModelStatus, setPerModelStatus] = useState({})

  const evaluate = useCallback(async (prompt) => {
    const modelsToEval = MODELS.filter((m) => selectedModels.includes(m.id))
    if (modelsToEval.length === 0) return

    startEvaluation()
    setPerModelStatus({})
    const results = []

    for (const model of modelsToEval) {
      setPerModelStatus((prev) => ({ ...prev, [model.id]: 'loading' }))
      try {
        const res = await callModel(model, prompt)
        results.push({ modelId: model.id, modelName: model.name, text: res.text, fallback: res.fallback, fallbackModel: res.fallbackModel || null, metrics: computeMetrics(res, model.id), error: null, ...emptyScores })
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'success' }))
      } catch (err) {
        results.push({ modelId: model.id, modelName: model.name, text: '', fallback: false, fallbackModel: null, metrics: computeMetrics({ latency: 0, inputTokens: 0, outputTokens: 0, text: '' }, model.id), error: err.message, ...emptyScores })
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'error' }))
      }
    }

    const successful = results.filter((r) => !r.error)
    if (successful.length > 1) {
      const scores = await judgeResponses(successful)
      for (const score of scores) {
        const match = results.find((r) => r.modelName === score.model)
        if (!match) continue
        match.accuracy = Number(score.accuracy) || 0
        match.clarity = Number(score.clarity) || 0
        match.completeness = Number(score.completeness) || 0
        match.coding = Number(score.coding) || 0
        match.reasoning = Number(score.reasoning) || 0
        match.research = Number(score.research) || 0
        match.finance = Number(score.finance) || 0
        match.accounting = Number(score.accounting) || 0
        match.metrics.qualityScore = Number(((match.accuracy + match.clarity + match.completeness) / 3).toFixed(1))
      }
    }

    setResults(results)
  }, [selectedModels, startEvaluation, setResults])

  return { evaluate, perModelStatus }
}
