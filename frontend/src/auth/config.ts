/**
 * Whether this build talks to a real identity provider.
 *
 * Browsing is public, so the site is expected to run with no OIDC provider at
 * all — the shipped defaults point at `auth.example.com`, a placeholder under
 * the RFC 2606 reserved `example.com`, which can never resolve to a real
 * provider.
 *
 * That matters because the Keycloak client initialises with `check-sso`, and
 * with the login iframe disabled it does that by redirecting the whole browser
 * to the authorization endpoint. Against an unreachable issuer the visitor
 * lands on a DNS error page and the app never paints — the exact opposite of
 * the anonymous mode the README promises.
 *
 * So an issuer under the reserved `example.com` means "no identity provider",
 * exactly like an unset one.
 */

/** A host under the reserved example.com, e.g. `auth.example.com`. */
const RESERVED_EXAMPLE_HOST = /(^|\.)example\.com$/i

/**
 * Whether the given issuer URL names a usable OIDC provider.
 *
 * Anything empty, unparseable, or under the reserved `example.com` is not one.
 */
export function isOidcConfigured(issuer: string | undefined | null): boolean {
  const url = (issuer ?? '').trim()
  if (!url) return false

  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return false
  }
  return !RESERVED_EXAMPLE_HOST.test(host)
}

/** The configured issuer, or an empty string when there is none. */
export const oidcIssuer: string = (import.meta.env.VITE_KEYCLOAK_URL as string | undefined) ?? ''

/** The configured realm and client, empty when there is no provider. */
export const oidcRealm: string = (import.meta.env.VITE_KEYCLOAK_REALM as string | undefined) ?? ''
export const oidcClientId: string = (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined) ?? ''

/** True when this build has a real identity provider to sign in against. */
export const oidcConfigured: boolean = isOidcConfigured(oidcIssuer)
