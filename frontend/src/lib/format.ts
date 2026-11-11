import type { TFunction } from 'i18next'
import type { NewsCard, RelatedItem } from '../api/client'

export const isCn = (lang: string) => lang.startsWith('zh')
export const pick = (lang: string, cn?: string | null, en?: string | null): string =>
  (isCn(lang) ? (cn || en) : (en || cn)) || ''

/** Locale-aware headline: falls back to whichever language is present. */
export function cardTitle(card: NewsCard | RelatedItem, lang: string): string {
  return pick(lang, card.title_cn, card.title_en) || card.title
}

export function cardSource(card: NewsCard, lang: string): string {
  return pick(lang, card.source_cn, card.source_en) || card.source
}

/** "12分钟前" / "3h ago" from an ISO timestamp. */
export function timeAgo(iso: string, _lang: string, t: TFunction): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return t('time.now')
  if (mins < 60) return `${mins}${t('time.minAgo')}`
  return `${Math.floor(mins / 60)}${t('time.hourAgo')}`
}

/** Heat formatted like the design ("98.1w" — 万/ten-thousand shorthand). */
export function heatLabel(heat: number): string {
  return `${heat.toFixed(1)}w`
}

export const upColor = (dir: number) => (dir > 0 ? 'var(--up)' : 'var(--down)')
export const changeColor = (chg: string) =>
  chg.trim().startsWith('-') ? 'var(--down)' : 'var(--up)'
