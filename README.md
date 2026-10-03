# LLM Evalution — AI Model Comparison Dashboard

A React + Vite dashboard for comparing LLM responses side-by-side. Select multiple models, run the same prompt across them, inspect quality scores and runtime metrics, and estimate API costs.

## What it does

- 🔎 **Searchable model catalog** — filter models by provider and quickly select a comparison set.
- ⚔️ **Side-by-side evaluation** — send one prompt to multiple models and inspect their responses together.
- 🧠 **Quality judging** — compares successful responses on accuracy, clarity, and completeness.
- ⚡ **Performance metrics** — latency, throughput, token counts, output speed, and response size.
- 💰 **Pricing calculator** — estimate input/output spend for a chosen model and token volume.
- 📊 **Comparison summary** — highlights quality score, fastest response, lowest measured cost, and highest output throughput.
- 📈 **Charts and exports** — visualize evaluation results and export the comparison data.
- 🌓 **Responsive UI** — designed for desktop and mobile screens.
- 🔐 **API-key proxy** — provider credentials stay server-side through the `/api/proxy` endpoint.

## Models

The current catalog includes OpenAI, Claude, and Groq comparison models. Model metadata and configured price estimates live in `src/config/constants.js`, while requests are routed through the configured provider adapters in `api/proxy.mjs`.

### Free provider catalog

The evaluator supports multiple independent web-hosted providers so you are not locked to one gateway. The current free/free-credit connectors are:

- OpenRouter free endpoints
- Groq free-plan models
- Google Gemini free tier
- Hugging Face Inference Providers monthly free credits
- Cloudflare Workers AI account allocation
- NVIDIA Build free endpoints
- Mistral Studio Free mode
- Cerebras free/trial inference access
- Cohere free trial API keys
- SambaNova introductory free credits

Free access is quota/rate limited and can change. The UI treats all of these as zero-cost for evaluation accounting; it does not mean unlimited usage.

### Environment variables

Set only the providers you have keys for. The proxy checks server-side variables and never exposes them to the browser.

```text
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
GOOGLE_API_KEY=...
HF_TOKEN=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
NVIDIA_API_KEY=...
MISTRAL_API_KEY=...
CEREBRAS_API_KEY=...
COHERE_API_KEY=...
SAMBANOVA_API_KEY=...
```

## Tech stack

- React 19
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Radix UI
- OpenRouter / Anthropic / Groq provider APIs

## Local development

### Prerequisites

- Node.js 18+
- API keys for the providers you want to use

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Environment variables

Configure the provider keys used by `api/proxy.mjs`. For Claude Fable 5.1, either `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` is required; if both are present, the native Anthropic key is used for Claude requests.

```text
OPENROUTER_API_KEY=...
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...
```

## Project structure

```text
api/                 Provider proxy endpoint
src/components/      Comparison dashboard UI
src/config/          Models, metrics and pricing
src/context/         Application state
src/hooks/           Evaluation workflow
src/lib/              Provider API and pricing helpers
```

## Inspiration

The product direction is inspired by the idea of a unified AI model comparison site: searchable model discovery, side-by-side comparisons, pricing visibility, and practical decision-support metrics. This repository implements its own React/Vite architecture and evaluation workflow rather than copying the reference project's source code.

## License

This project remains under the license and terms currently present in this repository.
