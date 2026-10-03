import { JUDGE_MODEL } from '#/config/constants'

async function proxyFetch(provider, model, prompt, options = {}) {
  if (provider === 'ollama') {
    const start = performance.now()
    let res
    try {
      res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: { num_predict: options.maxTokens || 1536 },
        }),
      })
    } catch {
      throw new Error('Ollama is not reachable. Install/start Ollama and run the selected model locally.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`Ollama: ${data.error || res.statusText}`)
    return {
      choices: [{ message: { content: data.message?.content || '' } }],
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
      },
      _localLatency: performance.now() - start,
    }
  }

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model,
      prompt,
      maxTokens: options.maxTokens || 1024,
      reasoningEffort: options.reasoningEffort || 'low',
      jsonMode: !!options.jsonMode,
    }),
  })
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
  const providerMap = {
    Groq: 'groq',
    OpenRouter: 'openrouter',
    'Google AI': 'google-ai',
    'Hugging Face': 'hugging-face',
    'Cloudflare AI': 'cloudflare-ai',
    'NVIDIA NIM': 'nvidia-nim',
    Mistral: 'mistral',
    Cerebras: 'cerebras',
    Cohere: 'cohere',
    SambaNova: 'sambanova',
  }
  const provider = providerMap[model.provider] || 'openrouter'
  const target = model.id.replace(/^(hf|cloudflare|nvidia|google)\//, '')
  const data = await proxyFetch(provider, target, prompt, { maxTokens: 1536, reasoningEffort: 'low' })
  const parsed = parseResponse(data)
  return { ...parsed, latency: data._localLatency || (performance.now() - start), fallback: false }
}

export async function judgeResponses(responses) {
  const prompt = 'You are the audit evaluator for an AI model comparison dashboard.\n' +
    'Evaluate ONLY the responses supplied below for the user prompt.\n' +
    'Score every response from 1-10 on coding, reasoning, research, finance, accounting, accuracy, clarity, completeness.\n' +
    'Judge the actual response: correctness, relevance, instruction-following, useful detail, and technical quality. Do not score based on the model reputation.\n' +
    'Return JSON with one property named scores. scores is an array containing model, accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.\n\n' +
    responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 3500)}`).join('\n\n')

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
