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

const TASKS = [
  { id: 'coding', label: 'Coding', icon: '💻', keywords: ['code', 'coding', 'program', 'react', 'javascript', 'typescript', 'python', 'api', 'bug', 'debug', 'function', 'database', 'sql', 'app', 'software', 'implement', 'build'] },
  { id: 'reasoning', label: 'Reasoning', icon: '🧠', keywords: ['why', 'explain', 'solve', 'reason', 'logic', 'compare', 'analyze', 'strategy', 'derive', 'proof', 'decision'] },
  { id: 'research', label: 'Research', icon: '🔎', keywords: ['research', 'market', 'study', 'sources', 'literature', 'industry', 'trend', 'investigate', 'report'] },
  { id: 'finance', label: 'Finance', icon: '💰', keywords: ['finance', 'financial', 'investment', 'stock', 'portfolio', 'revenue', 'valuation', 'cash flow', 'profit', 'accounting', 'tax', 'budget'] },
  { id: 'creative', label: 'Creative', icon: '✍️', keywords: ['write', 'story', 'creative', 'marketing', 'caption', 'copy', 'poem', 'script', 'brand', 'campaign'] },
  { id: 'general', label: 'General knowledge', icon: '✨', keywords: [] },
]

export function detectTask(prompt) {
  const text = prompt.toLowerCase()
  let best = TASKS[TASKS.length - 1]
  let bestScore = 0
  for (const task of TASKS.slice(0, -1)) {
    const score = task.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = task }
  }
  return { ...best, confidence: bestScore ? Math.min(96, 55 + bestScore * 8) : 45 }
}

const priorityWeights = {
  quality: { quality: 0.65, speed: 0.1, cost: 0.05, task: 0.2 },
  balanced: { quality: 0.45, speed: 0.2, cost: 0.15, task: 0.2 },
  speed: { quality: 0.25, speed: 0.5, cost: 0.1, task: 0.15 },
  cost: { quality: 0.25, speed: 0.15, cost: 0.45, task: 0.15 },
}

function normalize(value, min, max, invert = false) {
  if (max === min) return 1
  const score = (value - min) / (max - min)
  return invert ? 1 - score : score
}

function buildRecommendation(results, task, priority) {
  const successful = results.filter((r) => !r.error && r.text)
  if (!successful.length) return null
  const weights = priorityWeights[priority] || priorityWeights.balanced
  const qualityValues = successful.map((r) => r.metrics.qualityScore || 0)
  const speedValues = successful.map((r) => r.metrics.latency || 0)
  const costValues = successful.map((r) => r.metrics.totalCost || 0)
  const taskKey = task.id === 'creative' ? 'clarity' : task.id === 'general' ? 'accuracy' : task.id
  const taskValues = successful.map((r) => r[taskKey] || 0)
  const qualityMax = Math.max(...qualityValues, 1)
  const speedMin = Math.min(...speedValues)
  const speedMax = Math.max(...speedValues)
  const costMin = Math.min(...costValues)
  const costMax = Math.max(...costValues)
  const taskMax = Math.max(...taskValues, 1)

  const ranked = successful.map((r) => {
    const quality = (r.metrics.qualityScore || 0) / qualityMax
    const speed = normalize(r.metrics.latency || speedMax, speedMin, speedMax, true)
    const cost = normalize(r.metrics.totalCost || costMax, costMin, costMax, true)
    const taskFit = (r[taskKey] || 0) / taskMax
    const recommendationScore = (quality * weights.quality + speed * weights.speed + cost * weights.cost + taskFit * weights.task) * 100
    return { modelId: r.modelId, modelName: r.modelName, score: Math.round(recommendationScore), quality: r.metrics.qualityScore || 0, speed: r.metrics.latency || 0, cost: r.metrics.totalCost || 0, taskFit: r[taskKey] || 0 }
  }).sort((a, b) => b.score - a.score)

  const winner = ranked[0]
  const reasons = []
  if (winner.quality >= Math.max(...ranked.map((r) => r.quality))) reasons.push('strongest measured quality')
  if (winner.speed === speedMin) reasons.push('fastest response')
  if (winner.cost === costMin) reasons.push('lowest measured cost')
  if (winner.taskFit === Math.max(...ranked.map((r) => r.taskFit))) reasons.push(`best ${task.label.toLowerCase()} fit`)
  return { task, priority, winner, ranked, reasons: reasons.slice(0, 2) }
}

export function useEvaluation() {
  const { selectedModels, startEvaluation, setResults } = useApp()
  const [perModelStatus, setPerModelStatus] = useState({})

  const evaluate = useCallback(async (prompt, priority = 'balanced') => {
    const modelsToEval = MODELS.filter((m) => selectedModels.includes(m.id))
    if (!modelsToEval.length) return
    startEvaluation()
    setPerModelStatus(Object.fromEntries(modelsToEval.map((m) => [m.id, 'loading'])))
    const task = detectTask(prompt)
    const settled = await Promise.allSettled(modelsToEval.map((model) => callModel(model, prompt)))
    const results = settled.map((item, index) => {
      const model = modelsToEval[index]
      if (item.status === 'fulfilled') {
        setPerModelStatus((prev) => ({ ...prev, [model.id]: 'success' }))
        const res = item.value
        return { modelId: model.id, modelName: model.name, text: res.text, fallback: false, fallbackModel: null, fallbackReason: null, metrics: computeMetrics(res, model.id), error: null, ...emptyScores }
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

    results.evaluationMeta = { task, priority, recommendation: buildRecommendation(results, task, priority) }
    setResults(results)
  }, [selectedModels, startEvaluation, setResults])

  return { evaluate, perModelStatus }
}
