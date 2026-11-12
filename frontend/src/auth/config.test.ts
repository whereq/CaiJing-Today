import { describe, expect, it } from 'vitest'
import { isOidcConfigured } from './config'

describe('isOidcConfigured', () => {
  it('accepts a real issuer', () => {
    expect(isOidcConfigured('https://idp.acme.com')).toBe(true)
    expect(isOidcConfigured('http://localhost:8080/realms/cj')).toBe(true)
  })

  it('treats an unset issuer as no identity provider', () => {
    expect(isOidcConfigured(undefined)).toBe(false)
    expect(isOidcConfigured(null)).toBe(false)
    expect(isOidcConfigured('')).toBe(false)
    expect(isOidcConfigured('   ')).toBe(false)
  })

  it('treats the shipped placeholder issuer as no identity provider', () => {
    // auth.example.com is under the RFC 2606 reserved example.com, so it can
    // never resolve to a real provider. Initialising the Keycloak client
    // against it redirects the browser to a DNS error page before the app
    // paints — the bug this guard exists to prevent.
    expect(isOidcConfigured('https://auth.example.com')).toBe(false)
    expect(isOidcConfigured('https://example.com')).toBe(false)
  })

  it('does not mistake a real domain for the reserved one', () => {
    expect(isOidcConfigured('https://idp.notexample.com')).toBe(true)
    expect(isOidcConfigured('https://example.com.evil.test')).toBe(true)
  })

  it('rejects an issuer that is not a URL', () => {
    expect(isOidcConfigured('undefined')).toBe(false)
    expect(isOidcConfigured('auth.example.com')).toBe(false)
  })
})
