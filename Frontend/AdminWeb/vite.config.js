import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: Number(env.DEV_PORT || 5175),
    strictPort: true,
    proxy: {
      '/api': {
        target: env.VITE_API_URL || 'http://localhost:4020',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'www',
    emptyOutDir: true,
  },
  }
})
