const PROVIDER_CONFIG = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    modelKey: ({ model }) => model.replace('groq/', ''),
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    envKey: 'DEEPSEEK_API_KEY',
    modelKey: 'deepseek-chat',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    envKey: 'MISTRAL_API_KEY',
    modelKey: 'mistral-small-latest',
  },
  together: {
    url: 'https://api.together.xyz/v1/chat/completions',
    envKey: 'TOGETHER_API_KEY',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    envKey: 'GEMINI_API_KEY',
  },
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body) return resolve(req.body)
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

function getKey(envKey) {
  return process.env[envKey] || process.env[`VITE_${envKey}`]
}

function isCreditError(data) {
  const message = data?.error?.message || ''
  return /more credits|fewer max_tokens|can only afford/i.test(message)
}

async function callOpenRouter({ apiKey, model, prompt, maxTokens }) {
  const response = await fetch(PROVIDER_CONFIG.openrouter.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
      'X-Title': 'LLM Evalution',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  })
  const data = await response.json()
  return { response, data }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { provider, model, prompt } = await parseBody(req)
  if (!provider || !prompt) return res.status(400).json({ error: 'Missing provider or prompt' })

  const config = PROVIDER_CONFIG[provider]
  if (!config) return res.status(400).json({ error: `Unknown provider: ${provider}` })

  const apiKey = getKey(config.envKey)
  if (!apiKey) return res.status(500).json({ error: `Missing API key for ${config.envKey}` })

  // OpenRouter paid models must not fail just because the account has limited credits.
  // If the requested output budget is too expensive, progressively reduce it so the
  // model can still return a useful short response when the account can afford one.
  if (provider === 'openrouter') {
    const requestedMaxTokens = 2048
    const budgets = [requestedMaxTokens, 1024, 512, 256, 128]

    try {
      for (const maxTokens of budgets) {
        const { response, data } = await callOpenRouter({ apiKey, model, prompt, maxTokens })
        if (response.ok) return res.status(200).json(data)

        if (!isCreditError(data)) {
          return res.status(response.status).json({ error: data.error?.message || response.statusText, provider })
        }
      }

      return res.status(402).json({
        error: 'OpenRouter has insufficient credits for this model. Please use the free fallback or add OpenRouter credits.',
        provider,
      })
    } catch (error) {
      return res.status(502).json({ error: error.message, provider })
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  let url = config.url
  let body

  if (provider === 'gemini') {
    url = `${config.url}?key=${apiKey}`
    body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  } else {
    headers.Authorization = `Bearer ${apiKey}`
    const modelId = config.modelKey
      ? (typeof config.modelKey === 'function' ? config.modelKey({ model }) : config.modelKey)
      : model
    body = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    })
  }

  try {
    const response = await fetch(url, { method: 'POST', headers, body })
    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || response.statusText, provider })
    }
    return res.status(200).json(data)
  } catch (error) {
    return res.status(502).json({ error: error.message, provider })
  }
}
