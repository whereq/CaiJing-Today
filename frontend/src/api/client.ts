import axios from 'axios'
import keycloak from '../auth/keycloak'

const API_BASE = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach a Bearer token when signed in; public news endpoints work anonymously.
apiClient.interceptors.request.use(async (config) => {
  if (!keycloak.authenticated) return config
  try {
    await keycloak.updateToken(30)
  } catch {
    return config
  }
  if (keycloak.token) config.headers.Authorization = `Bearer ${keycloak.token}`
  return config
})

// ── Types (mirror backend api/schemas) ─────────────────────────────────────────
export interface CategoryInfo {
  id: string
  cn: string
  en: string
  color: string
  count: number
}

export interface NewsCard {
  id: number
  title: string
  title_cn?: string | null
  title_en?: string | null
  summary?: string | null
  summary_cn?: string | null
  summary_en?: string | null
  source: string
  source_cn?: string | null
  source_en?: string | null
  region?: string | null
  category: string
  published_at: string
  heat: number
  url?: string | null
}

export interface ArticleStat { key_cn: string; key_en: string; value: string; up: number }
export interface RelatedItem {
  id: number; title: string; title_cn?: string | null; title_en?: string | null
  source: string; published_at: string
}
export interface FlashItem { time: string; text: string; text_cn?: string | null; text_en?: string | null }

export interface Article {
  id: number
  ref: string
  category: string
  title: string
  title_cn?: string | null
  title_en?: string | null
  source: string
  author_cn: string
  author_en: string
  published_at: string
  lede_cn: string
  lede_en: string
  body_cn: string[]
  body_en: string[]
  stats: ArticleStat[]
  tags_cn: string[]
  tags_en: string[]
  related: RelatedItem[]
  flash: FlashItem[]
}

export interface Quote { name_cn: string; name_en: string; value: string; change: string; direction: number }
export interface Chart extends Quote { points: number[] }
export interface SectorHeat { name_cn: string; name_en: string; change_pct: number; inflow: number }
export interface Coin { symbol: string; name_cn: string; name_en: string; price: string; change_pct: number; color: string }
export interface Chain { name_cn: string; name_en: string; tvl: string; gas: string; change_pct: number; color: string }
export interface NewToken { symbol: string; venue_cn: string; venue_en: string; date: string; change_pct: number }
export interface CryptoStat { key_cn: string; key_en: string; value_cn: string; value_en: string; up: number }
export interface CryptoBundle { coins: Coin[]; stats: CryptoStat[]; chains: Chain[]; new_tokens: NewToken[] }
export interface CalendarEvent { time: string; importance: number; name_cn: string; name_en: string; forecast: string }
export interface Keyword { cn: string; en: string }
export interface SourceInfo { name_cn: string; name_en: string; region: string }
export interface HotStock { rank: number; symbol: string; name_cn: string; name_en: string; market: string; heat: number; change_pct: number; trend: number; url?: string | null }

export type RangeKey = '1h' | '24h' | '7d' | '30d'

/** Backend `/search` payload: the page of results plus the true match count. */
export interface SearchResponse {
  results: NewsCard[]
  total: number
}

/** What `api.search()` resolves to — the payload plus the measured round-trip. */
export interface SearchResult extends SearchResponse {
  /** Wall-clock milliseconds the request actually took. */
  elapsedMs: number
}

// ── API functions ──────────────────────────────────────────────────────────────
export const api = {
  getCategories: async (): Promise<CategoryInfo[]> =>
    (await apiClient.get<CategoryInfo[]>('/categories')).data,

  getHot: async (range: RangeKey = '24h', limit = 50): Promise<NewsCard[]> =>
    (await apiClient.get<NewsCard[]>('/news/hot', { params: { range, limit } })).data,

  getLatest: async (params: { range?: RangeKey; category?: string; source?: string; limit?: number }): Promise<NewsCard[]> =>
    (await apiClient.get<NewsCard[]>('/news/latest', { params })).data,

  getByCategory: async (cat: string, params: { range?: RangeKey; source?: string; limit?: number; offset?: number } = {}): Promise<NewsCard[]> =>
    (await apiClient.get<NewsCard[]>(`/news/category/${cat}`, { params })).data,

  getBoards: async (range: RangeKey = '24h'): Promise<Record<string, NewsCard[]>> =>
    (await apiClient.get<Record<string, NewsCard[]>>('/news/boards', { params: { range } })).data,

  getFlash: async (limit = 10): Promise<FlashItem[]> =>
    (await apiClient.get<FlashItem[]>('/news/flash', { params: { limit } })).data,

  getArticle: async (id: number): Promise<Article> =>
    (await apiClient.get<Article>(`/news/${id}`)).data,

  search: async (q: string, range: RangeKey = '30d', limit = 30): Promise<SearchResult> => {
    // Measure the real round-trip — the UI reports this instead of a constant.
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const { data } = await apiClient.get<SearchResponse | NewsCard[]>('/search', { params: { q, range, limit } })
    const elapsedMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0
    // Tolerate the older bare-array shape so a frontend-first rollout does not
    // break the search page while the API is still being rolled out.
    if (Array.isArray(data)) return { results: data, total: data.length, elapsedMs }
    return { ...data, elapsedMs }
  },

  getQuotes: async (): Promise<Quote[]> => (await apiClient.get<Quote[]>('/market/quotes')).data,
  getCharts: async (): Promise<Chart[]> => (await apiClient.get<Chart[]>('/market/charts')).data,
  getSectors: async (): Promise<SectorHeat[]> => (await apiClient.get<SectorHeat[]>('/market/sectors')).data,
  getCrypto: async (): Promise<CryptoBundle> => (await apiClient.get<CryptoBundle>('/market/crypto')).data,
  getCalendar: async (): Promise<CalendarEvent[]> => (await apiClient.get<CalendarEvent[]>('/market/calendar')).data,
  getKeywords: async (): Promise<Keyword[]> => (await apiClient.get<Keyword[]>('/market/keywords')).data,
  getSources: async (): Promise<SourceInfo[]> => (await apiClient.get<SourceInfo[]>('/market/sources')).data,
  getHotStocks: async (): Promise<HotStock[]> => (await apiClient.get<HotStock[]>('/market/hotstocks')).data,
}
