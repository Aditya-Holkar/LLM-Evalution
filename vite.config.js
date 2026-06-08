import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

if (!process.env.OPENROUTER_API_KEY) {
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf-8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!key.startsWith('VITE_') && !process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req, res, next) => {
          if (req.method !== 'POST') return next()
          const { default: handler } = await import('./api/proxy.mjs')
          handler(req, res)
        })
      },
    },
  ],
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
})
