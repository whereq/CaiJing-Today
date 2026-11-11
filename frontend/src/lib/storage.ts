/** Minimal encoded localStorage helpers (base64 of URI-encoded value). */
function encode(value: string): string {
  try { return btoa(encodeURIComponent(value)) } catch { return '' }
}
function decode(raw: string): string {
  try { return decodeURIComponent(atob(raw)) } catch {
    try { return atob(raw) } catch { return raw }
  }
}
export function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, encode(value)) } catch { /* quota */ }
}
export function lsGet(key: string): string | null {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : decode(raw)
  } catch { return null }
}
