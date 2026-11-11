import { describe, expect, it } from 'vitest'
import { cardSource, cardTitle, changeColor, heatLabel, isCn, pick, timeAgo } from './format'

const t = ((key: string) => key) as never

describe('pick', () => {
  it('prefers the requested language', () => {
    expect(pick('zh', '中文', 'English')).toBe('中文')
    expect(pick('en', '中文', 'English')).toBe('English')
  })

  it('falls back to the other language when one is missing', () => {
    expect(pick('zh', null, 'English')).toBe('English')
    expect(pick('en', '中文', null)).toBe('中文')
    expect(pick('en', null, null)).toBe('')
  })
})

describe('isCn', () => {
  it('recognises Chinese locales only', () => {
    expect(isCn('zh')).toBe(true)
    expect(isCn('zh-CN')).toBe(true)
    expect(isCn('en')).toBe(false)
  })
})

describe('cardTitle / cardSource', () => {
  const card = {
    id: 1, title: 'raw', title_cn: '标题', title_en: 'Title',
    source: 'gdelt', source_cn: null, source_en: null,
    category: 'macro', published_at: '2026-08-12T12:00:00+00:00', heat: 50,
  }

  it('uses the bilingual title when present', () => {
    expect(cardTitle(card, 'zh')).toBe('标题')
    expect(cardTitle(card, 'en')).toBe('Title')
  })

  it('falls back to the raw title', () => {
    expect(cardTitle({ ...card, title_cn: null, title_en: null }, 'zh')).toBe('raw')
  })

  it('falls back to the raw source when no translated source exists', () => {
    // Live rows carry the collector's raw source id, not a display name.
    expect(cardSource(card, 'zh')).toBe('gdelt')
  })
})

describe('timeAgo', () => {
  const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()

  it('reports "just now" for a fresh timestamp', () => {
    expect(timeAgo(iso(5_000), 'zh', t)).toBe('time.now')
  })

  it('reports minutes', () => {
    expect(timeAgo(iso(5 * 60_000), 'zh', t)).toBe('5time.minAgo')
  })

  it('reports hours', () => {
    expect(timeAgo(iso(3 * 3_600_000), 'zh', t)).toBe('3time.hourAgo')
  })

  it('returns an empty string for an unparseable timestamp', () => {
    expect(timeAgo('not-a-date', 'zh', t)).toBe('')
  })
})

describe('heatLabel', () => {
  it('formats heat with one decimal', () => {
    expect(heatLabel(98.14)).toBe('98.1w')
  })
})

describe('changeColor', () => {
  it('maps a leading minus to the down colour', () => {
    expect(changeColor('-1.20%')).toBe('var(--down)')
  })

  it('maps anything else to the up colour', () => {
    expect(changeColor('+1.20%')).toBe('var(--up)')
  })
})
