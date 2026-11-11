import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the dev server proxies /api. Point it at the API you are running:
//   - host + `npm run dev`  →  http://localhost:8000 (the default)
//   - docker compose dev    →  http://caijing-api:8000 (set by the compose file)
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The dev server is a local tool; accept whatever hostname you reach it
    // on (localhost, a LAN IP, or a tunnel) instead of pinning one.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
