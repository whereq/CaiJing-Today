import { describe, expect, it } from 'vitest'
import { SOURCES, distinctSources, sourceLabel } from './sources'

describe('sourceLabel', () => {
  it('returns a bilingual label for a known source id', () => {
    expect(sourceLabel('akshare_em_global', 'zh')).toBe('东方财富·全球快讯')
    expect(sourceLabel('akshare_em_global', 'en')).toBe('Eastmoney Global')
  })

  it('falls back to the raw id for an unknown source', () => {
    // Never show a blank label for a source the registry has not caught up with.
    expect(sourceLabel('brand_new_feed', 'zh')).toBe('brand_new_feed')
  })
})

describe('distinctSources', () => {
  it('lists each source once, in first-seen order', () => {
    const cards = [
      { source: 'gdelt' }, { source: 'polygon' }, { source: 'gdelt' }, { source: 'rss' },
    ]
    expect(distinctSources(cards)).toEqual(['gdelt', 'polygon', 'rss'])
  })

  it('ignores empty source values', () => {
    expect(distinctSources([{ source: '' }, { source: 'gdelt' }])).toEqual(['gdelt'])
  })
})

describe('SOURCES registry', () => {
  it('has unique ids', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length)
  })

  it('gives every source both a Chinese and an English name', () => {
    for (const s of SOURCES) {
      expect(s.cn.length).toBeGreaterThan(0)
      expect(s.en.length).toBeGreaterThan(0)
    }
  })
})
