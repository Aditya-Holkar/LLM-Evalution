export const MAX_FREE_TRIES = 3

export const MODELS = [
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Efficient and cost-conscious model for everyday text workloads.',
    tags: ['Fast', 'Cost-effective'],
    contextWindow: '16K',
    fallback: null,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Versatile multimodal model with strong reasoning and general performance.',
    tags: ['Versatile', 'Advanced'],
    contextWindow: '128K',
    fallback: null,
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Fast foundation model suited to high-volume and latency-sensitive workloads.',
    tags: ['Fast', 'Versatile'],
    contextWindow: '1M',
    fallback: 'gemini',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Large open-weight model designed for capable instruction following.',
    tags: ['Powerful', 'Open'],
    contextWindow: '128K',
    fallback: 'groq',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'High-capability model with an emphasis on reasoning and value.',
    tags: ['Powerful', 'Cost-effective'],
    contextWindow: '64K',
    fallback: 'deepseek',
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    provider: 'Mistral AI',
    description: 'Compact instruction model useful when speed and efficiency matter.',
    tags: ['Fast', 'Efficient'],
    contextWindow: '8K',
    fallback: 'mistral',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    description: 'Large open-source model for demanding general-purpose workloads.',
    tags: ['Powerful', 'Open'],
    contextWindow: '128K',
    fallback: 'together',
  },
]

export const PRICING = {
  'openai/gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  'google/gemini-2.0-flash-001': { input: 0.0001, output: 0.0004 },
  'meta-llama/llama-3.3-70b-instruct': { input: 0.00059, output: 0.00079 },
  'deepseek/deepseek-chat': { input: 0.00027, output: 0.0011 },
  'mistralai/mistral-7b-instruct': { input: 0.00015, output: 0.00015 },
  'qwen/qwen-2.5-72b-instruct': { input: 0.0009, output: 0.0009 },
}

export const JUDGE_MODEL = 'openai/gpt-4o'

export const PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'

export const METRICS = [
  { id: 'latency', label: 'Response Time', category: 'Speed', format: 's', suffix: 's' },
  { id: 'msPerOutputToken', label: 'ms per Output Token', category: 'Speed', format: 'ms', suffix: 'ms' },
  { id: 'throughput', label: 'Throughput', category: 'Speed', format: 'number', suffix: 'tok/s' },
  { id: 'inputTokens', label: 'Input Tokens', category: 'Tokens', format: 'number', suffix: '' },
  { id: 'outputTokens', label: 'Output Tokens', category: 'Tokens', format: 'number', suffix: '' },
  { id: 'totalTokens', label: 'Total Tokens', category: 'Tokens', format: 'number', suffix: '' },
  { id: 'tokenRatio', label: 'Token Ratio (Out/In)', category: 'Tokens', format: 'ratio', suffix: '' },
  { id: 'totalCost', label: 'Total Cost', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'inputCost', label: 'Input Cost', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'outputCost', label: 'Output Cost', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'costPer1kOutput', label: 'Cost per 1K Output Tokens', category: 'Cost', format: 'currency', suffix: '' },
  { id: 'charCount', label: 'Character Count', category: 'Text', format: 'number', suffix: '' },
  { id: 'wordCount', label: 'Word Count', category: 'Text', format: 'number', suffix: '' },
  { id: 'outputTokensPerSec', label: 'Output Tokens/sec', category: 'Speed', format: 'number', suffix: '/s' },
]

export const METRIC_IDS = METRICS.map((m) => m.id)
