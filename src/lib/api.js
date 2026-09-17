import { JUDGE_MODEL } from '#/config/constants'

async function proxyFetch(provider, model, prompt) {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, prompt }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${provider}: ${data.error || res.statusText}`)
  return data
}

function parseResponse(data) {
  const choice = data.choices?.[0]
  const text = choice?.message?.content || ''
  if (!text) throw new Error('Model returned an empty response')
  return { text, inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 }
}

export async function callModel(model, prompt) {
  const start = performance.now()
  try {
    if (model.provider === 'Groq') {
      const data = await proxyFetch('groq', model.id, prompt)
      const parsed = parseResponse(data)
      return { ...parsed, latency: performance.now() - start, fallback: false }
    }

    const data = await proxyFetch('openrouter', model.id, prompt)
    const parsed = parseResponse(data)
    return { ...parsed, latency: performance.now() - start, fallback: false }
  } catch (primaryError) {
    if (model.fallback !== 'groq') throw primaryError

    const fallbackStart = performance.now()
    try {
      const data = await proxyFetch('groq', 'openai/gpt-oss-120b', prompt)
      const parsed = parseResponse(data)
      return {
        ...parsed,
        latency: performance.now() - fallbackStart,
        fallback: true,
        fallbackModel: 'GPT-OSS 120B',
        fallbackReason: primaryError.message,
      }
    } catch (fallbackError) {
      throw new Error(`${model.name} failed: ${primaryError.message}. Groq fallback also failed: ${fallbackError.message}`)
    }
  }
}

export async function judgeResponses(responses) {
  const prompt = `You are the audit evaluator for an AI model comparison dashboard.
Evaluate ONLY the responses supplied below for the user's prompt.
Score every model from 1-10 on: coding, reasoning, research, finance, accounting, accuracy, clarity, completeness.
Do not use outside model reputation. Judge the actual response quality and relevance.
Return ONLY a JSON array. Each object must contain exactly: model, accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 5000)}`).join('\n\n')}`

  try {
    const data = await proxyFetch('groq', JUDGE_MODEL, prompt)
    const text = data.choices?.[0]?.message?.content || ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Audit model did not return JSON')
    const scores = JSON.parse(match[0])
    if (!Array.isArray(scores)) throw new Error('Invalid audit score format')
    return scores
  } catch {
    return responses.map((r) => ({
      model: r.modelName, accuracy: 0, clarity: 0, completeness: 0,
      coding: 0, reasoning: 0, research: 0, finance: 0, accounting: 0,
    }))
  }
}
