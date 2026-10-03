const SOURCES = [
  { provider: 'Groq', envKey: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/models', country: 'USA' },
];

function normalizeModel(source, item) {
  const rawId = item.id || item.name;
  if (!rawId || !rawId.startsWith('openai/gpt-oss-')) return null;
  const allowed = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);
  if (!allowed.has(rawId)) return null;
  const id = rawId;
  return {
    id,
    name: item.name || rawId,
    provider: source.provider,
    description: item.description || 'OpenAI GPT-OSS model served through Groq.',
    apiModel: rawId,
    tags: ['Hosted', 'Reasoning'],
    contextWindow: String(item.context_length || 131072),
    country: source.country,
    dynamic: true,
    pricing: { input: Number(item.pricing?.prompt || 0), output: Number(item.pricing?.completion || 0) },
  };
}

async function fetchSource(source) {
  const key = process.env[source.envKey];
  if (!key) return { provider: source.provider, configured: false, models: [] };
  const response = await fetch(source.url, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { provider: source.provider, configured: true, models: [], error: data?.error?.message || data?.message || response.statusText };
  const models = (Array.isArray(data) ? data : (data.data || [])).map((item) => normalizeModel(source, item)).filter(Boolean);
  const fallback = [
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', context_length: 131072 },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', context_length: 131072 },
  ];
  for (const item of fallback) {
    if (!models.some((model) => model.id === item.id)) models.push(normalizeModel(source, item));
  }
  return { provider: source.provider, configured: true, models };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const result = await fetchSource(SOURCES[0]).catch((error) => ({ provider: 'Groq', configured: true, models: [], error: error.message }));
  return res.status(200).json({
    refreshedAt: new Date().toISOString(),
    providers: [result],
    models: result.models || [],
    count: (result.models || []).length,
  });
}