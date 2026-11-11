import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../auth/AuthProvider'

/** Render a component with the providers the app wires up in main.tsx.
 *
 *  `route` sets the initial router entry; `path` (when given) mounts the
 *  component under a matching `<Route>` so `useParams` / `useSearchParams`
 *  resolve the same way they do in the real app.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { route?: string; path?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  const { route = '/', path, ...rest } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider>
            <AuthProvider>
              {path ? (
                <Routes>
                  <Route path={path} element={children} />
                </Routes>
              ) : (
                children
              )}
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
    ...rest,
  })
}
