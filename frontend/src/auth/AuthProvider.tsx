import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import keycloak from './keycloak'
import { resolveAvatarValue } from '../utils/avatars'

interface AuthContextValue {
  isAuthenticated: boolean
  token: string | undefined
  username: string | undefined
  displayName: string | undefined
  avatar: string | undefined
  roles: string[]
  isAdmin: boolean
  login: () => void
  register: () => void
  logout: () => void
}

function ssoAvatar(tokenParsed: Record<string, unknown> | undefined): string | undefined {
  const raw = (tokenParsed?.['avatar'] ?? tokenParsed?.['picture']) as string | undefined
  return resolveAvatarValue(raw) ?? undefined
}

function extractRoles(tokenParsed: Record<string, unknown> | undefined): string[] {
  const realmAccess = tokenParsed?.['realm_access'] as { roles?: string[] } | undefined
  return realmAccess?.roles ?? []
}

function buildDisplayName(
  tokenParsed: Record<string, unknown> | undefined,
  username: string | undefined,
): string | undefined {
  const first = (tokenParsed?.['given_name'] as string | undefined)?.trim()
  const last = (tokenParsed?.['family_name'] as string | undefined)?.trim()
  const fullName = [first, last].filter(Boolean).join(' ')
  return fullName || username
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(keycloak.authenticated ?? false)
  const [token, setToken] = useState<string | undefined>(keycloak.token)
  const [username, setUsername] = useState<string | undefined>(
    keycloak.tokenParsed?.['preferred_username'] as string | undefined,
  )
  const [displayName, setDisplayName] = useState<string | undefined>(() =>
    buildDisplayName(keycloak.tokenParsed, keycloak.tokenParsed?.['preferred_username'] as string | undefined),
  )
  const [avatar, setAvatar] = useState<string | undefined>(() => ssoAvatar(keycloak.tokenParsed))
  const [roles, setRoles] = useState<string[]>(() => extractRoles(keycloak.tokenParsed))
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!keycloak.authenticated) return
    refreshTimer.current = setInterval(async () => {
      try {
        const refreshed = await keycloak.updateToken(30)
        if (refreshed) {
          const newUsername = keycloak.tokenParsed?.['preferred_username'] as string | undefined
          setToken(keycloak.token)
          setUsername(newUsername)
          setDisplayName(buildDisplayName(keycloak.tokenParsed, newUsername))
          setAvatar(ssoAvatar(keycloak.tokenParsed))
          setRoles(extractRoles(keycloak.tokenParsed))
        }
      } catch {
        setIsAuthenticated(false)
        setToken(undefined)
        setUsername(undefined)
        setDisplayName(undefined)
        setAvatar(undefined)
        setRoles([])
      }
    }, 60_000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [])

  const login = () => keycloak.login()
  const register = () => keycloak.register()
  const logout = () => keycloak.logout()
  const isAdmin = roles.includes('cj-admin')

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, username, displayName, avatar, roles, isAdmin, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export type { AuthContextValue }
