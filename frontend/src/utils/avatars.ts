/* Caijing avatar resolution (display-only).
 *
 * caijing is read-only and has no account/profile store, so there is no native
 * avatar picker. The displayed avatar resolves as:
 *   1. SSO picture from the JWT (`picture`/`avatar` claim, e.g. Google)
 *   2. anonymous default (signed-in user with no picture)
 *   3. a stable random anonymous pose (guest visitor)
 */
import keycloak from '../auth/keycloak'

// 8 anonymous poses (guest default — one is picked at random per browser).
export const ANON_POSES: string[] = Array.from({ length: 8 }, (_, i) => `/avatars/anonymous/a${i + 1}.svg`)
export const ANON_DEFAULT = ANON_POSES[0]

/** Resolve a raw avatar/picture value to a displayable URL, or null if unset. */
export function resolveAvatarValue(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/')) {
    const base = (keycloak.authServerUrl || '').replace(/\/+$/, '')
    return base ? `${base}${value}` : value
  }
  return value
}

/** A stable random anonymous pose for this browser (guest visitors). */
export function guestAvatar(): string {
  try {
    const KEY = 'cj_guest_avatar'
    let v = localStorage.getItem(KEY)
    if (!v || !ANON_POSES.includes(v)) {
      v = ANON_POSES[Math.floor(Math.random() * ANON_POSES.length)]
      localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return ANON_DEFAULT
  }
}
