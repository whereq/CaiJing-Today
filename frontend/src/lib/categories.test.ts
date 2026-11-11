import { describe, expect, it } from 'vitest'
import { CATS, catById } from './categories'

describe('catById', () => {
  it('returns the matching category', () => {
    expect(catById('crypto').cn).toBe('加密')
    expect(catById('realestate').en).toBe('REAL ESTATE')
  })

  it('falls back to the first category for an unknown id', () => {
    expect(catById('does-not-exist')).toBe(CATS[0])
    expect(catById('')).toBe(CATS[0])
  })
})

describe('CATS', () => {
  it('exposes the 12 taxonomy ids', () => {
    expect(CATS.map((c) => c.id)).toEqual([
      'macro', 'equities', 'us', 'bonds', 'fx', 'commodities',
      'crypto', 'realestate', 'tech', 'companies', 'policy', 'opinion',
    ])
  })

  it('gives every category a distinct colour', () => {
    expect(new Set(CATS.map((c) => c.color)).size).toBe(CATS.length)
  })
})
