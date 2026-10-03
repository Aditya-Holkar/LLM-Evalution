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
    'Evaluate ONLY the response below against the original user prompt.\n' +
    'Score every metric from 1-10: accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.\n' +
    'Use the same 1-10 scale for every response. Judge the actual answer, not the model reputation.\n' +
    'Return ONLY valid JSON in exactly this shape: {"scores":[{"model":"MODEL_NAME","accuracy":0,"clarity":0,"completeness":0,"coding":0,"reasoning":0,"research":0,"finance":0,"accounting":0}]}\n' +
    'Original user prompt:\n' + userPrompt + '\n\n' +
    'Model: ' + response.modelName + '\n' +
    'Response:\n' + response.text.slice(0, 5000);
}

export async function judgeResponses(responses, userPrompt) {
  if (!responses.length) return [];

  const prompt = 'You are the audit evaluator for an AI model comparison dashboard.\n' +
    'Evaluate ONLY the responses supplied below against the original user prompt.\n' +
    'Score every response from 1-10 on accuracy, clarity, completeness, coding, reasoning, research, finance, accounting.\n' +
    'Judge the actual response, not the model reputation.\n' +
    'Return ONLY valid JSON in exactly this shape: {"scores":[{"model":"MODEL_NAME","accuracy":0,"clarity":0,"completeness":0,"coding":0,"reasoning":0,"research":0,"finance":0,"accounting":0}]}\n\n' +
    'Original user prompt:\n' + userPrompt + '\n\n' +
    responses.map((r, i) => `Response ${i + 1} (${r.modelName}):\n${r.text.slice(0, 2500)}`).join('\n\n');

  try {
    const data = await proxyFetch('groq', JUDGE_MODEL, prompt, { maxTokens: 1400, reasoningEffort: 'low', jsonMode: true });
    const parsed = parseJudgeJson(data.choices?.[0]?.message?.content);
    if (Array.isArray(parsed?.scores) && parsed.scores.length) return parsed.scores;
  } catch (error) {
    console.warn('Batch audit failed, retrying per response:', error);
  }

  const settled = await Promise.allSettled(responses.map(async (response) => {
    const data = await proxyFetch('groq', JUDGE_MODEL, buildJudgePrompt(response, userPrompt), { maxTokens: 650, reasoningEffort: 'low', jsonMode: true });
    const parsed = parseJudgeJson(data.choices?.[0]?.message?.content);
    const score = Array.isArray(parsed?.scores) ? parsed.scores[0] : null;
    if (!score) throw new Error('Invalid audit score format');
    return score;
  }));
  return settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
}
