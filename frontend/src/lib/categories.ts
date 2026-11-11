/** Static category taxonomy (mirrors backend caijing/taxonomy.py CATEGORIES).
 *  Used for immediate colour/label rendering; live counts come from /categories. */
export interface Cat { id: string; cn: string; en: string; color: string }

export const CATS: Cat[] = [
  { id: 'macro', cn: '宏观', en: 'MACRO', color: '#0B63CE' },
  { id: 'equities', cn: '股市', en: 'EQUITIES', color: '#c0392b' },
  { id: 'us', cn: '美股', en: 'US STOCKS', color: '#1f6f5c' },
  { id: 'bonds', cn: '债券', en: 'BONDS', color: '#5b4b8a' },
  { id: 'fx', cn: '外汇', en: 'FX', color: '#0f7b8a' },
  { id: 'commodities', cn: '大宗商品', en: 'COMMODITIES', color: '#a35b12' },
  { id: 'crypto', cn: '加密', en: 'CRYPTO', color: '#7a4bbd' },
  { id: 'realestate', cn: '房产', en: 'REAL ESTATE', color: '#6b6b1e' },
  { id: 'tech', cn: '科技', en: 'TECH', color: '#1b5fa8' },
  { id: 'companies', cn: '公司', en: 'COMPANIES', color: '#8a3d6b' },
  { id: 'policy', cn: '政策', en: 'POLICY', color: '#2f6a2f' },
  { id: 'opinion', cn: '观点', en: 'OPINION', color: '#5a5a63' },
]

const BY_ID = new Map(CATS.map(c => [c.id, c]))
export const catById = (id: string): Cat => BY_ID.get(id) ?? CATS[0]
