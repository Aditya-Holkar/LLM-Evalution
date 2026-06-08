const PROVIDER_CONFIG = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    modelKey: ({ model }) => model.replace('meta-llama/', ''),
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

  const apiKey = process.env[config.envKey]
  if (!apiKey) return res.status(500).json({ error: `Missing API key for ${config.envKey}` })

  const headers = { 'Content-Type': 'application/json' }
  let url = config.url
  let body

  if (provider === 'gemini') {
    url = `${config.url}?key=${apiKey}`
    body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    const modelId = config.modelKey
      ? (typeof config.modelKey === 'function' ? config.modelKey({ model }) : config.modelKey)
      : model
    body = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    })
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = req.headers.origin || req.headers.referer || ''
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
