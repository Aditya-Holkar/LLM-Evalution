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
  const charCount = res.text.length
  const wordCount = res.text ? res.text.trim().split(/\s+/).length : 0

  return {
    latency: latency / 1000,
    msPerOutputToken: outputTokens > 0 ? latency / outputTokens : 0,
    throughput: latency > 0 ? (totalTokens / (latency / 1000)) : 0,
    inputTokens,
    outputTokens,
    totalTokens,
    tokenRatio: inputTokens > 0 ? (outputTokens / inputTokens) : 0,
    totalCost,
    inputCost,
    outputCost,
    costPer1kOutput: outputTokens > 0 ? (outputCost / outputTokens) * 1000 : 0,
    charCount,
    wordCount,
    outputTokensPerSec: latency > 0 ? (outputTokens / (latency / 1000)) : 0,
  }
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
        results.push({
          modelId: model.id,
          modelName: model.name,
          text: res.text,
          fallback: res.fallback,
          metrics: computeMetrics(res, model.id),
          error: null,
          accuracy: 0,
          clarity: 0,
          completeness: 0,
        })
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'success' }))
      } catch (err) {
        results.push({
          modelId: model.id,
          modelName: model.name,
          text: '',
          fallback: false,
          metrics: {
            latency: 0, msPerOutputToken: 0, throughput: 0,
            inputTokens: 0, outputTokens: 0, totalTokens: 0, tokenRatio: 0,
            totalCost: 0, inputCost: 0, outputCost: 0, costPer1kOutput: 0,
            charCount: 0, wordCount: 0, outputTokensPerSec: 0,
          },
          error: err.message,
          accuracy: 0, clarity: 0, completeness: 0,
        })
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'error' }))
      }
    }

    const successful = results.filter((r) => !r.error)
    if (successful.length > 1) {
      try {
        const scores = await judgeResponses(successful)
        for (const score of scores) {
          const match = results.find((r) => r.modelName === score.model)
          if (match) {
            match.accuracy = score.accuracy || 0
            match.clarity = score.clarity || 0
            match.completeness = score.completeness || 0
          }
        }
      } catch {}
    }

    setResults(results)
  }, [selectedModels, startEvaluation, setResults])

  return { evaluate, perModelStatus }
}
