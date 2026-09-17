async function proxyFetch(provider, model, prompt) {
  const res = await fetch('/api/proxy', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, prompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(`${provider}: ${err.error || res.statusText}`)
  }
  return res.json()
}

function parseOpenRouterResponse(data) {
  const choice = data.choices?.[0]
  return { text: choice?.message?.content || '', inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 }
}

function parseStandardResponse(data) {
  const choice = data.choices?.[0]
  return { text: choice?.message?.content || '', inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 }
}

const FALLBACK_MAP = { groq: (modelId, prompt) => proxyFetch('groq', modelId, prompt) }

export async function callModel(model, prompt) {
  const start = performance.now()
  try {
    const data = await proxyFetch('openrouter', model.id, prompt)
    const elapsed = performance.now() - start
    const { text, inputTokens, outputTokens } = parseOpenRouterResponse(data)
    return { text, inputTokens, outputTokens, latency: elapsed, fallback: false }
  } catch (err) {
    const fallbackFn = FALLBACK_MAP[model.fallback]
    if (!fallbackFn) throw err
    const fallbackStart = performance.now()
    const data = await fallbackFn('openai/gpt-oss-20b', prompt)
    const { text, inputTokens, outputTokens } = parseStandardResponse(data)
    return { text, inputTokens, outputTokens, latency: performance.now() - fallbackStart, fallback: true, fallbackModel: 'GPT-OSS 20B' }
  }
}

export async function judgeResponses(responses) {
  const prompt = `Evaluate each response for the user's current prompt. Score each model from 1-10 in these use cases: coding, reasoning, research, finance, accounting. Also score accuracy, clarity, completeness. Base scores only on the response quality and relevance to the prompt. Return ONLY valid JSON array. Each object must contain model, accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 1800)}`).join('\n\n')}`

  try {
    const data = await proxyFetch('groq', 'openai/gpt-oss-20b', prompt)
    const text = data.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {}

  return responses.map((r) => ({
    model: r.modelName, accuracy: 0, clarity: 0, completeness: 0,
    coding: 0, reasoning: 0, research: 0, finance: 0, accounting: 0,
  }))
}
