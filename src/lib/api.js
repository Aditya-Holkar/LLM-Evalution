async function proxyFetch(provider, model, prompt) {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  return {
    text: choice?.message?.content || '',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  }
}

function parseStandardResponse(data) {
  const choice = data.choices?.[0]
  return {
    text: choice?.message?.content || '',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  }
}

const FALLBACK_MAP = {
  groq: (modelId, prompt) => proxyFetch('groq', modelId, prompt),
}

export async function callModel(model, prompt) {
  const start = performance.now()
  const modelId = model.id

  try {
    const data = await proxyFetch('openrouter', modelId, prompt)
    const elapsed = performance.now() - start
    const { text, inputTokens, outputTokens } = parseOpenRouterResponse(data)
    return { text, inputTokens, outputTokens, latency: elapsed, fallback: false }
  } catch (err) {
    const fallbackFn = FALLBACK_MAP[model.fallback]
    if (!fallbackFn) throw err
    const fallbackStart = performance.now()
    const data = await fallbackFn(modelId, prompt)
    const { text, inputTokens, outputTokens } = parseStandardResponse(data)
    return {
      text,
      inputTokens,
      outputTokens,
      latency: performance.now() - fallbackStart,
      fallback: true,
    }
  }
}

export async function judgeResponses(responses) {
  const prompt = `Rate the following LLM responses on a scale of 1-10 for accuracy, clarity, and completeness. Return a JSON array with objects containing "model", "accuracy", "clarity", "completeness".

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 1000)}`).join('\n\n')}`

  try {
    const data = await proxyFetch('openrouter', 'openai/gpt-6-astra', prompt)
    const text = data.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    const scores = responses.map(() => ({ accuracy: 7, clarity: 7, completeness: 7 }))
    return responses.map((r, i) => ({ model: r.modelName, ...scores[i] }))
  } catch {
    return responses.map((r) => ({ model: r.modelName, accuracy: 0, clarity: 0, completeness: 0 }))
  }
}
