export const MAX_FREE_TRIES = 3

// Focused comparison set: two recent model choices from OpenAI, Claude, and Groq.
// OpenAI/Claude can fall back to Groq when OpenRouter credits are unavailable.
export const MODELS = [
  {
    id: 'openai/gpt-6-astra', name: 'GPT-6 Astra', provider: 'OpenAI',
    description: 'OpenAI flagship model for demanding reasoning, coding, and end-to-end work.',
    tags: ['Latest', 'Flagship', 'Reasoning'], contextWindow: '1.05M', fallback: 'groq',
  },
  {
    id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI',
    description: 'OpenAI model for complex professional work, coding, and agentic workflows.',
    tags: ['2nd Latest', 'Flagship', 'Coding'], contextWindow: '1.05M', fallback: 'groq',
  },
  {
    id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'Claude',
    description: 'Anthropic model for coding, knowledge work, and long-running agentic tasks.',
    tags: ['Latest', 'Coding', 'Knowledge Work'], contextWindow: '1M', fallback: 'groq',
  },
  {
    id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'Claude',
    description: 'Anthropic model for demanding reasoning and professional workloads.',
    tags: ['2nd Latest', 'Reasoning', 'Premium'], contextWindow: '1M', fallback: 'groq',
  },
  {
    id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'Groq',
    description: 'Open-weight 120B model served through Groq for fast inference and reasoning workloads.',
    tags: ['Latest', 'Fast', 'Open-weight'], contextWindow: '131K', fallback: 'groq',
  },
  {
    id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'Groq',
    description: 'Smaller GPT-OSS model served through Groq for high-speed, cost-sensitive workloads.',
    tags: ['2nd Latest', 'Very Fast', 'Cost-effective'], contextWindow: '131K', fallback: 'groq',
  },
]

export const PRICING = {
  'openai/gpt-6-astra': { input: 0.01, output: 0.05 },
  'openai/gpt-5.6-sol': { input: 0.002, output: 0.01 },
  'anthropic/claude-fable-5.1': { input: 0.01, output: 0.05 },
  'anthropic/claude-opus-5': { input: 0.005, output: 0.025 },
  'openai/gpt-oss-120b': { input: 0.00015, output: 0.0006 },
  'openai/gpt-oss-20b': { input: 0.000075, output: 0.0003 },
}

export const JUDGE_MODEL = 'openai/gpt-oss-20b'

export const PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'

// Only the metrics that are useful when making a model decision.
export const METRICS = [
  { id: 'latency', label: 'Response Time', category: 'Performance', format: 's', suffix: 's' },
  { id: 'totalTokens', label: 'Total Tokens', category: 'Usage', format: 'number', suffix: '' },
  { id: 'totalCost', label: 'Estimated Cost', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'outputTokensPerSec', label: 'Output Speed', category: 'Performance', format: 'number', suffix: ' tok/s' },
  { id: 'qualityScore', label: 'Quality Score', category: 'Quality', format: 'score', suffix: '/10' },
]

export const METRIC_IDS = METRICS.map((m) => m.id)
