import { JUDGE_MODEL } from '#/config/constants'

async function proxyFetch(provider, model, prompt, options = {}) {
  if (provider === 'ollama') {
    const start = performance.now()
    let res
    try {
      res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: { num_predict: options.maxTokens || 1536 },
        }),
      })
    } catch {
      throw new Error('Ollama is not reachable. Install/start Ollama and run the selected model locally.')
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`Ollama: ${data.error || res.statusText}`)
    return {
      choices: [{ message: { content: data.message?.content || '' } }],
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
      },
      _localLatency: performance.now() - start,
    }
  }

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model,
      prompt,
      maxTokens: options.maxTokens || 1024,
      reasoningEffort: options.reasoningEffort || 'low',
      jsonMode: !!options.jsonMode,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail ? ` (${data.detail})` : ''
    throw new Error(`${provider}: ${data.error || res.statusText}${detail}`)
  }
  return data
}

function parseResponse(data) {
  const openAIText = data.choices?.[0]?.message?.content
  const anthropicText = Array.isArray(data.content)
    ? data.content.filter((item) => item?.type === 'text').map((item) => item.text).join('\n')
    : ''
  const text = typeof openAIText === 'string' ? openAIText : anthropicText
  if (!text.trim()) throw new Error('Model returned an empty response')
  return {
    text,
    inputTokens: data.usage?.prompt_tokens || data.usage?.input_tokens || 0,
    outputTokens: data.usage?.completion_tokens || data.usage?.output_tokens || 0,
  }
}

export async function callModel(model, prompt) {
  const start = performance.now()
  const providerMap = {
    Groq: 'groq',
    OpenRouter: 'openrouter',
    'Google AI': 'google-ai',
    'Hugging Face': 'hugging-face',
    'Cloudflare AI': 'cloudflare-ai',
    'NVIDIA NIM': 'nvidia-nim',
    Mistral: 'mistral',
    Cerebras: 'cerebras',
    Cohere: 'cohere',
    SambaNova: 'sambanova',
    SiliconFlow: 'siliconflow',
  }
  const provider = providerMap[model.provider] || 'openrouter'
  const target = (model.apiModel || model.id).replace(/^(hf|cloudflare|nvidia|google)\//, '')
  const data = await proxyFetch(provider, target, prompt, { maxTokens: 1536, reasoningEffort: 'low' })
  const parsed = parseResponse(data)
  return { ...parsed, latency: data._localLatency || (performance.now() - start), fallback: false }
}

function parseJudgeJson(text) {
  const cleaned = String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
}

function buildJudgePrompt(response, userPrompt) {
  return 'You are the audit evaluator for an AI model comparison dashboard.\n' +
    'Analyze ONLY this model response against the original user prompt.\n' +
    'Score every metric independently from 1-10: accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.\n' +
    'Do not judge the model reputation. Judge only the actual response.\n' +
    'If a metric is not directly relevant, still score how well the response handles that dimension rather than returning null.\n' +
    'Return ONLY valid JSON: {\"scores\":[{\"modelId\":\"MODEL_ID\",\"accuracy\":1,\"clarity\":1,\"completeness\":1,\"coding\":1,\"reasoning\":1,\"research\":1,\"finance\":1,\"accounting\":1}]}\n' +
    'All values must be numbers between 1 and 10.\n\n' +
    'Original user prompt:\n' + userPrompt + '\n\n' +
    'Model ID: ' + response.modelId + '\n' +
    'Model name: ' + response.modelName + '\n' +
    'Response:\n' + response.text.slice(0, 6000);
}

export async function judgeResponses(responses, userPrompt) {
  if (!responses.length) return [];

  const settled = await Promise.allSettled(responses.map(async (response) => {
    const data = await proxyFetch('groq', JUDGE_MODEL, buildJudgePrompt(response, userPrompt), {
      maxTokens: 900,
      reasoningEffort: 'low',
      jsonMode: true,
    });
    const parsed = parseJudgeJson(data.choices?.[0]?.message?.content);
    const score = Array.isArray(parsed?.scores) ? parsed.scores[0] : null;
    if (!score) throw new Error('Audit judge returned no score');
    return {
      modelId: response.modelId,
      model: response.modelName,
      ...score,
    };
  }));

  return settled
    .filter((item) => item.status === 'fulfilled')
    .map((item) => item.value);
}