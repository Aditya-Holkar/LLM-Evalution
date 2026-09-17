const PROVIDER_CONFIG = {
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', envKey: 'OPENROUTER_API_KEY' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', envKey: 'GROQ_API_KEY' },
}

function parseBody(req) { return new Promise((resolve) => { if (req.body) return resolve(req.body); let body = ''; req.on('data', (chunk) => { body += chunk }); req.on('end', () => { try { resolve(JSON.parse(body)) } catch { resolve({}) } }); req.on('error', () => resolve({})) }) }
function getKey(envKey) { return process.env[envKey] || process.env[`VITE_${envKey}`] }
function isCreditError(data) { return /more credits|fewer max_tokens|can only afford|insufficient credits/i.test(data?.error?.message || '') }

async function callProvider(provider, apiKey, model, prompt, maxTokens, reasoningEffort, jsonMode) {
  const config = PROVIDER_CONFIG[provider]
  const body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }
  if (reasoningEffort && provider === 'groq') body.reasoning_effort = reasoningEffort
  if (jsonMode && provider === 'groq') body.response_format = { type: 'json_object' }
  const response = await fetch(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...(provider === 'openrouter' ? { 'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '', 'X-Title': 'LLM Evalution' } : {}) }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { provider, model, prompt, maxTokens = 1024, reasoningEffort = 'low', jsonMode = false } = await parseBody(req)
  if (!provider || !model || !prompt) return res.status(400).json({ error: 'Missing provider, model, or prompt' })
  const config = PROVIDER_CONFIG[provider]
  if (!config) return res.status(400).json({ error: `Unknown provider: ${provider}` })
  const apiKey = getKey(config.envKey)
  if (!apiKey) return res.status(500).json({ error: `Missing API key for ${config.envKey}` })
  try {
    if (provider === 'openrouter') {
      for (const budget of [maxTokens, 768, 384, 192].filter((v, i, a) => v > 0 && a.indexOf(v) === i)) {
        const { response, data } = await callProvider(provider, apiKey, model, prompt, budget, null, false)
        if (response.ok) return res.status(200).json(data)
        if (!isCreditError(data)) return res.status(response.status).json({ error: data.error?.message || response.statusText, provider })
      }
      return res.status(402).json({ error: 'OpenRouter credits are insufficient for this model.', provider })
    }
    const { response, data } = await callProvider('groq', apiKey, model, prompt, maxTokens, reasoningEffort, jsonMode)
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || response.statusText, provider })
    return res.status(200).json(data)
  } catch (error) { return res.status(502).json({ error: error.message, provider }) }
}
