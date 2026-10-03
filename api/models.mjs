const SOURCES = [
  { provider: 'Groq', envKey: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/models', country: 'USA' },
  { provider: 'Google AI', envKey: 'GOOGLE_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/models', country: 'USA', queryKey: true },
  { provider: 'NVIDIA NIM', envKey: 'NVIDIA_API_KEY', url: 'https://integrate.api.nvidia.com/v1/models', country: 'Global' },
  { provider: 'Mistral', envKey: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/models', country: 'France' },
  { provider: 'Cohere', envKey: 'COHERE_API_KEY', url: 'https://api.cohere.com/v1/models?endpoint=chat&page_size=1000', country: 'Canada', cohere: true },
  { provider: 'Routeway', envKey: 'ROUTEWAY_API_KEY', url: 'https://api.routeway.ai/v1/models', country: 'Global' },
  { provider: 'SiliconFlow', envKey: 'SILICONFLOW_API_KEY', url: 'https://api.siliconflow.cn/v1/models?sub_type=chat', country: 'China' },
];

function normalizeModel(source, item) {
  const rawId = item.id || item.name;
  if (!rawId) return null;
  const id = `${source.provider}::${rawId}`;
  const price = item.pricing || {};
  const input = Number(price.prompt ?? price.input ?? 0);
  const output = Number(price.completion ?? price.output ?? 0);
  const isFree = input === 0 && output === 0;
  const chatCapable = source.provider !== 'Mistral' || item.capabilities?.completion_chat !== false;
  if (!chatCapable) return null;
  return {
    id,
    name: item.name || rawId.split('/').pop() || rawId,
    provider: source.provider,
    description: item.description || `${source.provider} hosted model discovered from its live model catalog.`,
    apiModel: rawId,
    tags: [isFree ? 'Free' : 'Hosted', source.provider],
    contextWindow: String(item.context_length || item.max_context_length || item.contextWindow || '—'),
    country: source.country,
    dynamic: true,
    pricing: { input, output },
  };
}

async function fetchSource(source) {
  const key = process.env[source.envKey];
  if (!key) return { provider: source.provider, configured: false, models: [] };
  const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };
  const url = source.queryKey ? `${source.url}?key=${encodeURIComponent(key)}` : source.url;
  const response = await fetch(url, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { provider: source.provider, configured: true, models: [], error: data?.error?.message || data?.message || response.statusText };
  const raw = Array.isArray(data) ? data : (data.data || data.models || []);
  const models = raw.map((item) => normalizeModel(source, item)).filter(Boolean);
  models.sort((a, b) => Number(!(a.tags || []).includes('Free')) - Number(!(b.tags || []).includes('Free')) || a.name.localeCompare(b.name));
  return { provider: source.provider, configured: true, models: models.slice(0, 250) };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const settled = await Promise.allSettled(SOURCES.map(fetchSource));
  const providers = settled.map((item, index) => item.status === 'fulfilled'
    ? item.value
    : { provider: SOURCES[index].provider, configured: true, models: [], error: item.reason?.message || 'Catalog unavailable' });
  const models = providers.flatMap((provider) => provider.models);
  return res.status(200).json({
    refreshedAt: new Date().toISOString(),
    providers,
    models,
    count: models.length,
  });
}
