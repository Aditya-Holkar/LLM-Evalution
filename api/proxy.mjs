const PROVIDER_CONFIG = {
  'google-ai': { url: 'https://generativelanguage.googleapis.com/v1beta/models', envKey: 'GOOGLE_API_KEY' },
  'hugging-face': { url: 'https://router.huggingface.co/v1/chat/completions', envKey: 'HF_TOKEN' },
  'cloudflare-ai': { url: 'https://api.cloudflare.com/client/v4/accounts', envKey: 'CLOUDFLARE_API_TOKEN' },
  'nvidia-nim': { url: 'https://integrate.api.nvidia.com/v1/chat/completions', envKey: 'NVIDIA_API_KEY' },
  mistral: { url: 'https://api.mistral.ai/v1/chat/completions', envKey: 'MISTRAL_API_KEY' },
  cerebras: { url: 'https://api.cerebras.ai/v1/chat/completions', envKey: 'CEREBRAS_API_KEY' },
  cohere: { url: 'https://api.cohere.com/v2/chat', envKey: 'COHERE_API_KEY' },
  sambanova: { url: 'https://api.sambanova.ai/v1/chat/completions', envKey: 'SAMBANOVA_API_KEY' },
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', envKey: 'OPENROUTER_API_KEY' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', envKey: 'GROQ_API_KEY' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages', envKey: 'ANTHROPIC_API_KEY' },
}

function parseBody(req) { return new Promise((resolve) => { if (req.body) return resolve(req.body); let body = ''; req.on('data', (chunk) => { body += chunk }); req.on('end', () => { try { resolve(JSON.parse(body)) } catch { resolve({}) } }); req.on('error', () => resolve({})) }) }
function getKey(envKey) { return process.env[envKey] }
function isCreditError(data) { return /more credits|fewer max_tokens|can only afford|insufficient credits|credit balance/i.test(data?.error?.message || '') }
async function callGoogle(apiKey, model, prompt, maxTokens) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens } }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return { error: providerError('google-ai', data, response) }
  return { data: { choices: [{ message: { content: data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '' } }], usage: { prompt_tokens: data.usageMetadata?.promptTokenCount || 0, completion_tokens: data.usageMetadata?.candidatesTokenCount || 0 } }, provider: 'google-ai' }
}

async function callCloudflare(apiToken, model, prompt, maxTokens) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId) return { error: { error: 'Cloudflare AI: Missing CLOUDFLARE_ACCOUNT_ID', provider: 'cloudflare-ai' } }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return { error: providerError('cloudflare-ai', data, response) }
  return { data: { choices: [{ message: { content: data.result?.response || data.result?.text || '' } }] }, provider: 'cloudflare-ai' }
}


async function callProvider(provider, apiKey, model, prompt, maxTokens, reasoningEffort, jsonMode) {
  const config = PROVIDER_CONFIG[provider]
  if (provider === 'anthropic') {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  }

  const body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }
  if (reasoningEffort && provider === 'groq') body.reasoning_effort = reasoningEffort
  if (jsonSchema && provider === 'groq') body.response_format = jsonSchema
  else if (jsonMode && provider === 'groq') body.response_format = { type: 'json_object' }
  const response = await fetch(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...(provider === 'openrouter' ? { 'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '', 'X-Title': 'LLM Evalution' } : {}) }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

function extractText(data) {
  if (typeof data?.choices?.[0]?.message?.content === 'string') return data.choices[0].message.content
  if (Array.isArray(data?.content)) return data.content.filter((item) => item?.type === 'text').map((item) => item.text).join('\n')
  return ''
}

function providerError(provider, data, response) {
  const message = data?.error?.message || data?.message || response.statusText || 'Provider request failed'
  return { error: `${provider}: ${message}`, provider, status: response.status }
}

async function callClaude(model, prompt, maxTokens) {
  // Fable 5.1 has a native Anthropic API model id. Use it when an Anthropic key is
  // configured; otherwise use the exact same model through OpenRouter. No model substitution.
  const anthropicKey = getKey('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    const directModel = model === 'anthropic/claude-fable-5.1' ? 'claude-fable-5-1' : model.replace(/^anthropic\//, '')
    const direct = await callProvider('anthropic', anthropicKey, directModel, prompt, maxTokens, null, false)
    if (direct.response.ok) return { data: direct.data, provider: 'anthropic' }
    return { error: providerError('anthropic', direct.data, direct.response) }
  }

  const openrouterKey = getKey('OPENROUTER_API_KEY')
  if (!openrouterKey) return { error: { error: 'Claude: Missing OPENROUTER_API_KEY or ANTHROPIC_API_KEY', provider: 'openrouter' } }

  // Explicitly request the Claude model with provider failover enabled. OpenRouter's
  // provider failover stays on the same model; it never substitutes GPT/Groq/etc.
  const response = await callProvider('openrouter', openrouterKey, model, prompt, maxTokens, null, false)
  if (response.response.ok) return { data: response.data, provider: 'openrouter' }
  return { error: providerError('openrouter', response.data, response.response) }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { provider, model, prompt, maxTokens = 1024, reasoningEffort = 'low', jsonMode = false, jsonSchema = null } = await parseBody(req)
  if (!provider || !model || !prompt) return res.status(400).json({ error: 'Missing provider, model, or prompt' })
  const config = PROVIDER_CONFIG[provider]
  if (!config) return res.status(400).json({ error: `Unknown provider: ${provider}` })

  try {
    if (provider === 'google-ai') {
      const key = getKey('GOOGLE_API_KEY')
      if (!key) return res.status(500).json({ error: 'Missing API key for GOOGLE_API_KEY', provider })
      const result = await callGoogle(key, model, prompt, maxTokens)
      if (result.error) return res.status(result.error.status || 502).json(result.error)
      return res.status(200).json(result.data)
    }

    if (provider === 'cohere') {
      const key = getKey('COHERE_API_KEY')
      if (!key) return res.status(500).json({ error: 'Missing API key for COHERE_API_KEY', provider })
      const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) return res.status(response.status).json({ error: data.message || data.error || response.statusText, provider, detail: data })
      return res.status(200).json({ choices: [{ message: { content: data.message?.content?.filter?.((x) => x.type === 'text').map?.((x) => x.text).join('') || data.message?.content?.[0]?.text || '' } }], usage: { prompt_tokens: data.usage?.tokens?.input_tokens || 0, completion_tokens: data.usage?.tokens?.output_tokens || 0 } })
    }

    if (provider === 'cloudflare-ai') {
      const key = getKey('CLOUDFLARE_API_TOKEN')
      if (!key) return res.status(500).json({ error: 'Missing API token for CLOUDFLARE_API_TOKEN', provider })
      const result = await callCloudflare(key, model, prompt, maxTokens)
      if (result.error) return res.status(result.error.status || 502).json(result.error)
      return res.status(200).json(result.data)
    }

    if (provider === 'openrouter' && model.startsWith('anthropic/')) {
      const result = await callClaude(model, prompt, maxTokens)
      if (result.error) return res.status(result.error.status || 502).json(result.error)
      return res.status(200).json({ ...result.data, _provider: result.provider, _model: model })
    }

    const apiKey = getKey(config.envKey)
    if (!apiKey) return res.status(500).json({ error: `Missing API key for ${config.envKey}`, provider })

    if (provider === 'openrouter') {
      // Credit-aware retry keeps the requested model intact and only lowers its
      // output budget. It is not a model fallback.
      let lastError = null
      for (const budget of [maxTokens, 768, 384, 192].filter((v, i, a) => v > 0 && a.indexOf(v) === i)) {
        const result = await callProvider(provider, apiKey, model, prompt, budget, null, false)
        if (result.response.ok) return res.status(200).json(result.data)
        lastError = result
        if (!isCreditError(result.data)) return res.status(result.response.status).json(providerError(provider, result.data, result.response))
      }
      return res.status(402).json({ error: `OpenRouter credits are insufficient for ${model}. Add credits or configure ANTHROPIC_API_KEY for direct Claude access.`, provider, model, detail: lastError?.data?.error?.message || 'Insufficient credits' })
    }

    const result = await callProvider(provider, apiKey, model, prompt, maxTokens, reasoningEffort, jsonMode)
    if (!result.response.ok) return res.status(result.response.status).json(providerError(provider, result.data, result.response))
    return res.status(200).json(result.data)
  } catch (error) { return res.status(502).json({ error: error.message, provider, model }) }
}
