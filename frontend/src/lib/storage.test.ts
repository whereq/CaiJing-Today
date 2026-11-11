import { describe, expect, it } from 'vitest'
import { lsGet, lsSet } from './storage'

describe('localStorage helpers', () => {
  it('round-trips an ASCII value', () => {
    lsSet('k', 'macro')
    expect(lsGet('k')).toBe('macro')
  })

  it('round-trips a non-ASCII value', () => {
    lsSet('k', '财经今日')
    expect(lsGet('k')).toBe('财经今日')
  })

  it('returns null for a missing key', () => {
    expect(lsGet('nope')).toBeNull()
  })

  it('survives a corrupted value', () => {
    localStorage.setItem('broken', '!!!not-base64!!!')
    expect(typeof lsGet('broken')).toBe('string')
  })
})
