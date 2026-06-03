const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'

function getKey(name) {
  return import.meta.env[name] || ''
}

async function openRouterFetch(modelId, prompt) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey('VITE_OPENROUTER_API_KEY')}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
  })
  if (!res.ok) throw new Error(`OpenRouter: ${res.status} ${res.statusText}`)
  return res.json()
}

async function groqFetch(modelId, prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey('VITE_GROQ_API_KEY')}` },
    body: JSON.stringify({ model: modelId.replace('meta-llama/', ''), messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
  })
  if (!res.ok) throw new Error(`Groq: ${res.status}`)
  return res.json()
}

async function deepseekFetch(modelId, prompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey('VITE_DEEPSEEK_API_KEY')}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`DeepSeek: ${res.status}`)
  return res.json()
}

async function mistralFetch(modelId, prompt) {
  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey('VITE_MISTRAL_API_KEY')}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`Mistral: ${res.status}`)
  return res.json()
}

async function togetherFetch(modelId, prompt) {
  const res = await fetch(TOGETHER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey('VITE_TOGETHER_API_KEY')}` },
    body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`Together: ${res.status}`)
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

const FALLBACK_MAP = {
  groq: groqFetch,
  deepseek: deepseekFetch,
  mistral: mistralFetch,
  together: togetherFetch,
  gemini: null,
}

export async function callModel(model, prompt) {
  const start = performance.now()
  const modelId = model.id

  try {
    const data = await openRouterFetch(modelId, prompt)
    const elapsed = performance.now() - start
    const { text, inputTokens, outputTokens } = parseOpenRouterResponse(data)
    return { text, inputTokens, outputTokens, latency: elapsed, fallback: false }
  } catch (err) {
    if (model.fallback === 'gemini') {
      return callGeminiFallback(model, prompt)
    }
    const fallbackFn = FALLBACK_MAP[model.fallback]
    if (!fallbackFn) throw err
    const elapsed = performance.now() - start
    const data = await fallbackFn(modelId, prompt)
    const choice = data.choices?.[0]
    return {
      text: choice?.message?.content || '',
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      latency: elapsed,
      fallback: true,
    }
  }
}

async function callGeminiFallback(model, prompt) {
  const start = performance.now()
  const key = getKey('VITE_GEMINI_API_KEY')
  if (!key) throw new Error('No Gemini API key')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!res.ok) throw new Error(`Gemini: ${res.status}`)
  const data = await res.json()
  const elapsed = performance.now() - start
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { text, inputTokens: 0, outputTokens: 0, latency: elapsed, fallback: true }
}

export async function judgeResponses(responses) {
  const prompt = `Rate the following LLM responses on a scale of 1-10 for accuracy, clarity, and completeness. Return a JSON array with objects containing "model", "accuracy", "clarity", "completeness".

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 1000)}`).join('\n\n')}`

  try {
    const data = await openRouterFetch('openai/gpt-4o', prompt)
    const text = data.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    const scores = responses.map(() => ({ accuracy: 7, clarity: 7, completeness: 7 }))
    return responses.map((r, i) => ({ model: r.modelName, ...scores[i] }))
  } catch {
    return responses.map((r) => ({ model: r.modelName, accuracy: 0, clarity: 0, completeness: 0 }))
  }
}
