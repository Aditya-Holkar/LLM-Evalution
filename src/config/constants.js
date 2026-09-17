export const MAX_FREE_TRIES = 3

// Current comparison set. OpenAI and Claude are routed through OpenRouter;
// Groq models are called directly through the Groq proxy. No automatic fallback is used.
export const MODELS = [
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI', description: 'OpenAI flagship model for complex reasoning, coding, and professional work.', tags: ['Latest', 'Flagship', 'Reasoning'], contextWindow: '1.05M' },
  { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'OpenAI', description: 'OpenAI GPT-5.6 model focused on balancing intelligence and cost.', tags: ['2nd Latest', 'Balanced', 'Coding'], contextWindow: '1.05M' },
  { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'Claude', description: 'Anthropic model for agentic coding, knowledge work, and finance analysis.', tags: ['Latest', 'Coding', 'Knowledge Work'], contextWindow: '1M' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'Claude', description: 'Anthropic flagship model for demanding reasoning, coding, and long-horizon work.', tags: ['2nd Latest', 'Reasoning', 'Premium'], contextWindow: '1M' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'Groq', description: 'OpenAI open-weight 120B model served through Groq for fast reasoning and tool use.', tags: ['Latest', 'Fast', 'Open-weight'], contextWindow: '131K' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'Groq', description: 'OpenAI open-weight 20B model served through Groq for very fast, low-cost inference.', tags: ['2nd Latest', 'Very Fast', 'Cost-effective'], contextWindow: '131K' },
]

export const PRICING = {
  'openai/gpt-5.6-sol': { input: 0.002, output: 0.01 },
  'openai/gpt-5.6-terra': { input: 0.002, output: 0.012 },
  'anthropic/claude-fable-5.1': { input: 0.01, output: 0.05 },
  'anthropic/claude-opus-5': { input: 0.005, output: 0.025 },
  'openai/gpt-oss-120b': { input: 0.00015, output: 0.0006 },
  'openai/gpt-oss-20b': { input: 0.000075, output: 0.0003 },
}

// Strong Groq model used only for the audit/judge pass.
export const JUDGE_MODEL = 'openai/gpt-oss-120b'

export const PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'

export const METRICS = [
  { id: 'latency', label: 'Response Time', category: 'Performance', format: 's', suffix: 's' },
  { id: 'totalTokens', label: 'Total Tokens', category: 'Usage', format: 'number', suffix: '' },
  { id: 'totalCost', label: 'Estimated Cost', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'outputTokensPerSec', label: 'Output Speed', category: 'Performance', format: 'number', suffix: ' tok/s' },
  { id: 'qualityScore', label: 'Quality Score', category: 'Quality', format: 'score', suffix: '/10' },
]

export const METRIC_IDS = METRICS.map((m) => m.id)
