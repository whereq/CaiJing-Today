import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './i18n'
import App from './App'
import './index.css'
import keycloak from './auth/keycloak'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './contexts/ThemeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchInterval: 60_000, retry: 1 },
  },
})

function mount() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>,
  )
}

// News browsing is public — mount even if Keycloak SSO fails to initialise.
keycloak
  .init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false })
  .catch(() => { /* anonymous mode */ })
  .finally(mount)
