/** Feed source registry.
 *
 *  `NewsCard.source` carries the raw source id (the column value in
 *  `market_news_items.source`, written by the data collector). The ids are
 *  stable, but they are machine keys — not labels. This registry maps them to
 *  bilingual display names.
 *
 *  Why not the backend's `/market/sources`? That endpoint returns a static
 *  12-outlet editorial catalog (新浪财经 / 东方财富 / Caixin / Bloomberg / …)
 *  which has NO overlap with the ids the collector actually writes
 *  (`akshare_em_global`, `gdelt`, `polygon`, `rss`, `sec_edgar`). Filtering by
 *  catalog label therefore matched nothing. The registry below describes the
 *  sources that really exist in the feed.
 *
 *  Keep in sync with the collector's source ids.
 */

export interface SourceLabel {
  /** Raw source id — matches `NewsCard.source`. */
  id: string
  cn: string
  en: string
}

export const SOURCES: SourceLabel[] = [
  { id: 'akshare_em_global', cn: '东方财富·全球快讯', en: 'Eastmoney Global' },
  { id: 'akshare_em_cjzc', cn: '东方财富·财经早餐', en: 'Eastmoney Breakfast' },
  { id: 'rss', cn: '财经 RSS 聚合', en: 'Finance RSS Feeds' },
  { id: 'polygon', cn: 'Polygon.io', en: 'Polygon.io' },
  { id: 'gdelt', cn: 'GDELT 全球新闻', en: 'GDELT Global News' },
  { id: 'sec_edgar', cn: 'SEC EDGAR 公告', en: 'SEC EDGAR Filings' },
]

const BY_ID = new Map(SOURCES.map((s) => [s.id, s]))

/** Display name for a raw source id; falls back to the id itself. */
export function sourceLabel(id: string, lang: string): string {
  const hit = BY_ID.get(id)
  if (!hit) return id
  return lang.startsWith('zh') ? hit.cn : hit.en
}

/** Distinct raw source ids present in a set of cards, in first-seen order. */
export function distinctSources(cards: { source: string }[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of cards) {
    if (!c.source || seen.has(c.source)) continue
    seen.add(c.source)
    out.push(c.source)
  }
  return out
}
