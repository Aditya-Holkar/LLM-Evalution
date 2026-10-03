export const MAX_FREE_TRIES = 3

export const MODELS = [
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI', description: 'OpenAI flagship model for complex reasoning, coding, and professional work.', tags: ['Latest', 'Flagship', 'Reasoning'], contextWindow: '1.05M', country: 'USA' },
  { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'OpenAI', description: 'OpenAI GPT-5.6 model focused on balancing intelligence and cost.', tags: ['Balanced', 'Coding'], contextWindow: '1.05M', country: 'USA' },
  { id: 'anthropic/claude-fable-5.1', name: 'Claude Fable 5.1', provider: 'Claude', description: 'Anthropic model for agentic coding, knowledge work, and finance analysis.', tags: ['Latest', 'Coding', 'Knowledge Work'], contextWindow: '1M', country: 'USA' },
  { id: 'anthropic/claude-opus-5', name: 'Claude Opus 5', provider: 'Claude', description: 'Anthropic flagship model for demanding reasoning, coding, and long-horizon work.', tags: ['Reasoning', 'Premium'], contextWindow: '1M', country: 'USA' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'Groq', description: 'Open-weight model served through Groq for fast reasoning and tool use.', tags: ['Fast', 'Open-weight'], contextWindow: '131K', country: 'USA' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'Groq', description: 'Open-weight model served through Groq for very fast, low-cost inference.', tags: ['Very Fast', 'Cost-effective'], contextWindow: '131K', country: 'USA' },
  { id: 'ollama/qwen3.8', name: 'Qwen3.8 27B', provider: 'Ollama', country: 'China', description: 'Qwen open-weight model for coding, research, reasoning and multilingual work.', tags: ['China', 'Open-weight', 'Reasoning'], contextWindow: '256K', localModel: 'qwen3.8' },
  { id: 'ollama/deepseek-v3', name: 'DeepSeek-V3', provider: 'Ollama', country: 'China', description: 'Large open-weight MoE model for reasoning, coding, math and general tasks.', tags: ['China', 'Open-weight', 'MoE'], contextWindow: '160K', localModel: 'deepseek-v3' },
  { id: 'ollama/mistral', name: 'Mistral 7B', provider: 'Ollama', country: 'France', description: 'Compact open model from Mistral AI for fast local testing.', tags: ['France', 'Open-weight', 'Fast'], contextWindow: '32K', localModel: 'mistral' },
  { id: 'ollama/aya-expanse:8b', name: 'Aya Expanse 8B', provider: 'Ollama', country: 'Canada', description: 'Cohere For AI multilingual model supporting 23 languages.', tags: ['Canada', 'Multilingual', 'Open-weight'], contextWindow: '8K', localModel: 'aya-expanse:8b' },
  { id: 'ollama/gemma4:e4b', name: 'Gemma 4 E4B', provider: 'Ollama', country: 'USA', description: 'Small edge-friendly open model from Google DeepMind for local testing.', tags: ['USA', 'Small', 'Multimodal'], contextWindow: '16K', localModel: 'gemma4:e4b' },
  { id: 'ollama/phi3:3.8b', name: 'Phi-3 Mini 3.8B', provider: 'Ollama', country: 'USA', description: 'Lightweight Microsoft open model for fast local reasoning and instruction following.', tags: ['USA', 'Small', 'Fast'], contextWindow: '128K', localModel: 'phi3:3.8b' },
]

export const PRICING = {
  'openai/gpt-5.6-sol': { input: 0.002, output: 0.01 },
  'openai/gpt-5.6-terra': { input: 0.002, output: 0.012 },
  'anthropic/claude-fable-5.1': { input: 0.01, output: 0.05 },
  'anthropic/claude-opus-5': { input: 0.005, output: 0.025 },
  'openai/gpt-oss-120b': { input: 0.00015, output: 0.0006 },
  'openai/gpt-oss-20b': { input: 0.000075, output: 0.0003 },
  'ollama/qwen3.8': { input: 0, output: 0 },
  'ollama/deepseek-v3': { input: 0, output: 0 },
  'ollama/mistral': { input: 0, output: 0 },
  'ollama/aya-expanse:8b': { input: 0, output: 0 },
  'ollama/gemma4:e4b': { input: 0, output: 0 },
  'ollama/phi3:3.8b': { input: 0, output: 0 },
}

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

export const PROMPT_TEMPLATES = [
  { id: 'reasoning', label: 'Reasoning', prompt: 'Analyze this problem step by step. State the key assumptions, compare the possible approaches, and give a concise final conclusion. Problem: [YOUR PROBLEM]' },
  { id: 'coding', label: 'Coding', prompt: 'Build a production-ready solution for the following task. Include the code, explain the architecture, handle edge cases, and provide a short test example. Task: [YOUR CODING TASK]' },
  { id: 'math', label: 'Math', prompt: 'Solve the following mathematical problem. Show the important derivation steps, verify the result independently, and give the final answer clearly. Problem: [YOUR MATH PROBLEM]' },
  { id: 'research', label: 'Research', prompt: 'Research the following topic. Separate established facts from uncertain claims, identify useful sources to verify, compare important viewpoints, and summarize the findings. Topic: [YOUR TOPIC]' },
  { id: 'summarization', label: 'Summarization', prompt: 'Summarize the following text in three layers: a one-sentence summary, five key points, and important details that should not be lost. Text: [PASTE TEXT]' },
  { id: 'translation', label: 'Translation', prompt: 'Translate the following text into French, Hindi, Chinese and German. Preserve meaning, tone, technical terms and formatting. Text: [PASTE TEXT]' },
  { id: 'creative', label: 'Creative', prompt: 'Create three distinct versions of the following content: professional, friendly and highly creative. Explain the tone used in each version. Brief: [YOUR CREATIVE BRIEF]' },
  { id: 'data', label: 'Data Analysis', prompt: 'Analyze the following dataset or table. Identify trends, anomalies, relationships and actionable insights. Show calculations where useful and state limitations. Data: [PASTE DATA]' },
  { id: 'finance', label: 'Finance', prompt: 'Analyze this financial scenario using explicit assumptions. Discuss revenue, costs, risk, cash flow and key metrics. Do not invent missing facts. Scenario: [YOUR FINANCE QUESTION]' },
  { id: 'instruction', label: 'Instruction', prompt: 'Follow these instructions exactly. First restate the requested output format, then complete the task, then verify that every requirement was satisfied. Instructions: [YOUR INSTRUCTIONS]' },
]
