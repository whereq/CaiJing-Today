import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type RangeKey } from '../api/client'
import { Panel, Chip } from '../components/ui'
import PanelStatus from '../components/PanelStatus'
import { catById } from '../lib/categories'
import { cardTitle, cardSource, isCn, timeAgo, heatLabel, pick } from '../lib/format'
import { distinctSources, sourceLabel } from '../lib/sources'

const RANGES: { key: RangeKey; cn: string; en: string }[] = [
  { key: '1h', cn: '1小时', en: '1H' },
  { key: '24h', cn: '24小时', en: '24H' },
  { key: '7d', cn: '本周', en: '7D' },
  { key: '30d', cn: '本月', en: '30D' },
]

/** Rows per page. The backend caps `limit` at 200, so we page with `offset`
 *  instead of growing `limit` — growing it past 200 returns HTTP 422. */
const PAGE = 18

export default function Category() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { cat = 'macro' } = useParams()
  const c = catById(cat)

  const [range, setRange] = useState<RangeKey>('24h')
  const [source, setSource] = useState<string>('all')

  // The source chips must offer ids the API can actually match. The backend
  // filters on `NewsCard.source` (the collector's raw id), so we derive the
  // chips from the sources present in the current window instead of a static
  // catalog whose labels never matched.
  const { data: sourcePool } = useQuery({
    queryKey: ['category-sources', range],
    queryFn: () => api.getLatest({ range, limit: 200 }),
  })
  const sourceIds = distinctSources(sourcePool ?? [])

  const {
    data, isLoading, isError, refetch,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['category', cat, range, source],
    queryFn: ({ pageParam }) =>
      api.getByCategory(cat, {
        range,
        source: source === 'all' ? undefined : source,
        limit: PAGE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE ? undefined : allPages.length * PAGE),
  })

  const list = data?.pages.flat() ?? []
  const rangeLabel = t(`nav.range${range === '1h' ? '1h' : range === '24h' ? '24h' : range === '7d' ? '7d' : '30d'}`)

  return (
    <div style={{ padding: 10, maxWidth: 1800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Panel>
        <div style={{ padding: '20px 22px', background: c.color, color: '#fff', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '.12em', opacity: .85 }}>{c.en}</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{c.cn}</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, marginTop: 6, opacity: .9 }}>
            {t('nav.storiesIn', { count: list.length, range: rangeLabel })}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '9px 12px', borderBottom: '1px solid var(--bd)', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace", marginRight: 2 }}>{t('nav.filterSource')}</span>
          <Chip active={source === 'all'} onClick={() => setSource('all')}>{t('nav.all')}</Chip>
          {sourceIds.map((id) => (
            <Chip key={id} active={source === id} onClick={() => setSource(id)}>
              {sourceLabel(id, i18n.language)}
            </Chip>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '9px 12px', borderBottom: '1px solid var(--bd)', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace", marginRight: 2 }}>{t('nav.filterTime')}</span>
          {RANGES.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>{cn ? r.cn : r.en}</Chip>
          ))}
        </div>

        <PanelStatus
          loading={isLoading}
          error={isError}
          empty={!isLoading && !isError && list.length === 0}
          onRetry={() => void refetch()}
        />

        {list.map((h, i) => (
          <Link key={h.id} to={`/article/${h.id}`} data-hoverbg style={{ display: 'flex', gap: 11, alignItems: 'baseline', padding: '10px 12px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' }}>
            <span style={{ flex: '0 0 26px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: i < 3 ? c.color : 'var(--tx3)', filter: i < 3 ? 'brightness(1.4)' : 'none' }}>{i + 1}</span>
            <span style={{ flex: '1 1 auto', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500, lineHeight: 1.4 }}>{cardTitle(h, i18n.language)}</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginTop: 3 }}>{pick(i18n.language, h.summary_cn, h.summary_en)}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 5, fontSize: 10.5, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace" }}>
                <span style={{ color: 'var(--acc)' }}>{cardSource(h, i18n.language)}</span>
                <span>{timeAgo(h.published_at, i18n.language, t)}</span>
                <span>{heatLabel(h.heat)} {t('nav.heatUnit')}</span>
              </span>
            </span>
          </Link>
        ))}

        <div style={{ padding: 14, textAlign: 'center' }}>
          {hasNextPage ? (
            <button
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              data-hoverbg
              style={{ padding: '9px 22px', background: 'var(--panel2)', border: '1px solid var(--bd2)', borderRadius: 2, color: 'var(--tx2)', fontFamily: 'inherit', fontSize: 12, cursor: isFetchingNextPage ? 'default' : 'pointer', minHeight: 40 }}
            >
              {isFetchingNextPage ? t('nav.loadingMore') : t('nav.loadMore')}
            </button>
          ) : (
            !isLoading && !isError && list.length > 0 && (
              <span style={{ fontSize: 11.5, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace" }}>{t('nav.noMore')}</span>
            )
          )}
        </div>
      </Panel>
    </div>
  )
}
