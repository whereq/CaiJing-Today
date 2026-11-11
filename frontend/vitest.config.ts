import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config is kept separate from vite.config.ts so the dev server's
// Docker-network proxy (/api → http://caijing-api:8000) never leaks into
// tests: component tests mock `api` directly instead of hitting the network.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The SPA reads these at build time; give the tests a harmless value so
    // constructing the Keycloak client never sees `undefined`.
    env: {
      VITE_KEYCLOAK_URL: 'https://keycloak.test',
      VITE_KEYCLOAK_REALM: 'caijing-today',
      VITE_KEYCLOAK_CLIENT_ID: 'caijing-today-spa',
    },
  },
})
