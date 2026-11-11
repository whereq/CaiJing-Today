import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import zh from './locales/zh.json'

type Json = { [k: string]: string | Json }

function flatten(obj: Json, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out[key] = v
    else Object.assign(out, flatten(v, key))
  }
  return out
}

const ZH = flatten(zh as Json)
const EN = flatten(en as Json)

describe('locale files', () => {
  it('define exactly the same keys in both languages', () => {
    expect(Object.keys(EN).sort()).toEqual(Object.keys(ZH).sort())
  })

  it('never hard-code a result count or a latency', () => {
    // Regression guard: the search header used to claim "about 1,284 results
    // in 0.21s" no matter what the API returned. Counts and timings must be
    // interpolated from the real response.
    for (const [lang, table] of [['zh', ZH], ['en', EN]] as const) {
      for (const [k, v] of Object.entries(table)) {
        expect(v, `${lang}.${k}`).not.toMatch(/\d[\d,]*\s*(条结果|results)/)
        expect(v, `${lang}.${k}`).not.toMatch(/\d+\.\d+\s*(秒|s\b)/)
      }
    }
  })

  it('interpolates the real totals into the search strings', () => {
    for (const table of [ZH, EN]) {
      expect(table['search.resultCount']).toContain('{{total}}')
      expect(table['search.resultCountTruncated']).toContain('{{total}}')
      expect(table['search.resultCountTruncated']).toContain('{{shown}}')
      expect(table['search.elapsed']).toContain('{{seconds}}')
    }
  })

  it('has no empty strings', () => {
    for (const [lang, table] of [['zh', ZH], ['en', EN]] as const) {
      for (const [k, v] of Object.entries(table)) {
        expect(v.trim().length, `${lang}.${k}`).toBeGreaterThan(0)
      }
    }
  })
})
