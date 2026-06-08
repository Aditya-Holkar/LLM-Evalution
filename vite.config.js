import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-proxy',
      configureServer(server) {
        const env = loadEnv(server.config.mode, process.cwd(), '')
        for (const [k, v] of Object.entries(env)) {
          if (!k.startsWith('VITE_') && !process.env[k]) {
            process.env[k] = v
          }
        }
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
