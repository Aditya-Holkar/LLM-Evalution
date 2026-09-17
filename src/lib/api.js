import { JUDGE_MODEL } from '#/config/constants'

async function proxyFetch(provider, model, prompt, options = {}) {
  const res = await fetch('/api/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, model, prompt, maxTokens: options.maxTokens || 1024, reasoningEffort: options.reasoningEffort || 'low', jsonMode: !!options.jsonMode }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail ? ` (${data.detail})` : ''
    throw new Error(`${provider}: ${data.error || res.statusText}${detail}`)
  }
  return data
}

function parseResponse(data) {
  const openAIText = data.choices?.[0]?.message?.content
  const anthropicText = Array.isArray(data.content)
    ? data.content.filter((item) => item?.type === 'text').map((item) => item.text).join('\n')
    : ''
  const text = typeof openAIText === 'string' ? openAIText : anthropicText
  if (!text.trim()) throw new Error('Model returned an empty response')
  return {
    text,
    inputTokens: data.usage?.prompt_tokens || data.usage?.input_tokens || 0,
    outputTokens: data.usage?.completion_tokens || data.usage?.output_tokens || 0,
  }
}

export async function callModel(model, prompt) {
  const start = performance.now()
  // Claude models use the OpenRouter route in the UI. The server proxy can use
  // a native Anthropic key when configured, but it always calls the exact Claude model.
  const provider = model.provider === 'Groq' ? 'groq' : 'openrouter'
  const data = await proxyFetch(provider, model.id, prompt, { maxTokens: 1536, reasoningEffort: 'low' })
  return { ...parseResponse(data), latency: performance.now() - start, fallback: false }
}

export async function judgeResponses(responses) {
  const prompt = `You are the audit evaluator for an AI model comparison dashboard.
Evaluate ONLY the responses supplied below for the user's prompt.
Score every response from 1-10 on coding, reasoning, research, finance, accounting, accuracy, clarity, completeness.
Judge the actual response: correctness, relevance, instruction-following, useful detail, and technical quality. Do not score based on the model's reputation.
Return a JSON object with one property named scores. scores must be an array of objects, each containing exactly: model, accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.

${responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 3500)}`).join('\n\n')}`

  try {
    const data = await proxyFetch('groq', JUDGE_MODEL, prompt, { maxTokens: 900, reasoningEffort: 'low', jsonMode: true })
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed.scores)) throw new Error('Invalid audit score format')
    return parsed.scores
  } catch (error) {
    console.warn('Audit failed:', error)
    return []
  }
}
