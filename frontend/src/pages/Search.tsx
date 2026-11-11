import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Panel } from '../components/ui'
import PanelStatus from '../components/PanelStatus'
import KeywordChips from '../components/KeywordChips'
import { catById } from '../lib/categories'
import { cardTitle, cardSource, isCn, timeAgo, pick } from '../lib/format'

export default function Search() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  // Keep the box in sync when q changes via a keyword chip / back-nav, without an
  // effect: adjust state during render (React's recommended pattern).
  const [prevQ, setPrevQ] = useState(q)
  if (q !== prevQ) { setPrevQ(q); setInput(q) }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q, '30d'),
    enabled: q.length > 0,
  })
  const results = data?.results ?? []
  // The backend reports the TRUE number of matches in the window — never a
  // made-up figure. `shown` is how many of them fit in this page.
  const total = data?.total ?? 0
  const shown = results.length
  const truncated = total > shown
  const seconds = ((data?.elapsedMs ?? 0) / 1000).toFixed(2)

  const submit = () => {
    const term = input.trim()
    setParams(term ? { q: term } : {})
  }

  return (
    <div style={{ padding: 10, maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Panel style={{ padding: '14px 16px' }}>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} style={{ display: 'flex', border: '1px solid var(--bd2)', borderRadius: 2, background: 'var(--panel2)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('nav.searchPh')}
            style={{ flex: '1 1 auto', minWidth: 0, padding: '11px 12px', background: 'transparent', border: 0, outline: 'none', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, minHeight: 44 }}
          />
          <button type="submit" style={{ padding: '0 20px', background: 'var(--acc2)', border: 0, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>{t('nav.search')}</button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace" }}>{t('nav.hotSearch')}</span>
          <KeywordChips numbered onPick={(kw) => navigate(`/search?q=${encodeURIComponent(kw)}`)} />
        </div>
      </Panel>

      <Panel>
        <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--panel2)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--tx2)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <span>
            {!q
              ? t('search.emptyHint')
              : truncated
                ? t('search.resultCountTruncated', { query: q, total, shown })
                : t('search.resultCount', { query: q, total })}
          </span>
          {q && !isLoading && !isError && (
            <span style={{ color: 'var(--tx3)' }}>{t('search.elapsed', { seconds })}</span>
          )}
        </div>

        {q && (
          <PanelStatus
            loading={isLoading}
            error={isError}
            empty={!isLoading && !isError && results.length === 0}
            onRetry={() => void refetch()}
          />
        )}

        {results.map((h) => {
          const c = catById(h.category)
          return (
            <Link key={h.id} to={`/article/${h.id}`} data-hoverbg style={{ display: 'flex', gap: 11, padding: '11px 12px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' }}>
              <span style={{ flex: '0 0 auto', alignSelf: 'flex-start', padding: '3px 8px', borderRadius: 2, background: c.color, color: '#fff', fontSize: 10.5, fontWeight: 600 }}>{cn ? c.cn : c.en}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500 }}>{cardTitle(h, i18n.language)}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginTop: 3 }}>{pick(i18n.language, h.summary_cn, h.summary_en)}</span>
                <span style={{ display: 'flex', gap: 9, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--tx3)' }}>
                  <span style={{ color: 'var(--acc)' }}>{cardSource(h, i18n.language)}</span>
                  <span>{timeAgo(h.published_at, i18n.language, t)}</span>
                </span>
              </span>
            </Link>
          )
        })}
      </Panel>
    </div>
  )
}
