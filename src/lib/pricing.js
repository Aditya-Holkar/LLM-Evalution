import { PRICING } from '../config/constants'

export function calculateCost(modelId, inputTokens, outputTokens) {
  const price = PRICING[modelId]
  if (!price) return 0
  const inputCost = (inputTokens / 1000) * price.input
  const outputCost = (outputTokens / 1000) * price.output
  return inputCost + outputCost
}
