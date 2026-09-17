import { JUDGE_MODEL } from '#/config/constants'

async function proxyFetch(provider, model, prompt, options = {}) {
  const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, model, prompt, maxTokens: options.maxTokens || 1024, reasoningEffort: options.reasoningEffort || 'low' }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${provider}: ${data.error || res.statusText}`)
  return data
}

function parseResponse(data) {
  const choice = data.choices?.[0]
  const text = choice?.message?.content || ''
  if (!text.trim()) throw new Error('Model returned an empty response')
  return { text, inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 }
}

export async function callModel(model, prompt) {
  const start = performance.now()
  const provider = model.provider === 'Groq' ? 'groq' : 'openrouter'
  try {
    const data = await proxyFetch(provider, model.id, prompt, { maxTokens: 1536, reasoningEffort: 'low' })
    return { ...parseResponse(data), latency: performance.now() - start, fallback: false }
  } catch (primaryError) {
    if (model.provider === 'Groq') throw primaryError
    const fallbackStart = performance.now()
    try {
      const data = await proxyFetch('groq', 'openai/gpt-oss-120b', prompt, { maxTokens: 1536, reasoningEffort: 'low' })
      return { ...parseResponse(data), latency: performance.now() - fallbackStart, fallback: true, fallbackModel: 'GPT-OSS 120B', fallbackReason: primaryError.message }
    } catch (fallbackError) {
      throw new Error(`${model.name} failed: ${primaryError.message}. Groq fallback failed: ${fallbackError.message}`)
    }
  }
}

export async function judgeResponses(responses) {
  const prompt = `You are the audit evaluator for an AI model comparison dashboard.
Evaluate ONLY the responses supplied below for the user's prompt.
Score every response from 1-10 on coding, reasoning, research, finance, accounting, accuracy, clarity, completeness.
Judge the actual response: correctness, relevance, instruction-following, useful detail, and technical quality. Do not score based on the model's reputation.
Return ONLY a JSON array. Each object must contain exactly: model, accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 3500)}`).join('\n\n')}`

  try {
    const data = await proxyFetch('groq', JUDGE_MODEL, prompt, { maxTokens: 900, reasoningEffort: 'low' })
    const text = data.choices?.[0]?.message?.content || ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Audit model did not return JSON')
    const scores = JSON.parse(match[0])
    if (!Array.isArray(scores)) throw new Error('Invalid audit score format')
    return scores
  } catch (error) {
    console.warn('Audit failed:', error)
    return []
  }
}
