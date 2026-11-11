import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Panel, SectionHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { CATS } from '../../lib/categories'
import { cardTitle } from '../../lib/format'
import { sourceLabel } from '../../lib/sources'

const PER_SOURCE = 4

export default function BrowseBySource() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['latest', 'source-pool'],
    queryFn: () => api.getLatest({ range: '7d', limit: 200 }),
  })
  const cards = data ?? []

  // Group the REAL stories by the collector's raw source id. The old static
  // 12-outlet catalog had no overlap with those ids, so it labelled arbitrary
  // headlines with outlet names they never came from.
  const groups = new Map<string, typeof cards>()
  for (const c of cards) {
    const bucket = groups.get(c.source)
    if (bucket) bucket.push(c)
    else groups.set(c.source, [c])
  }
  const list = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  return (
    <Panel>
      <SectionHeader accent="var(--acc2)" title={t('nav.bySource')} note={`${list.length} ${t('nav.sourcesUnit')}`} />
      <PanelStatus
        loading={isLoading}
        error={isError}
        empty={!isLoading && !isError && list.length === 0}
        onRetry={() => void refetch()}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))' }}>
        {list.map(([id, items], i) => {
          const name = sourceLabel(id, i18n.language)
          const color = CATS[i % CATS.length].color
          return (
            <div key={id} style={{ borderRight: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--bd)' }}>
                <span style={{ width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 2, background: color, color: '#fff', fontSize: 10, fontWeight: 700, flex: '0 0 auto' }}>{name[0]}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)' }}>{name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: 'var(--tx3)' }}>{items.length}</span>
              </div>
              {items.slice(0, PER_SOURCE).map((it, j) => (
                <Link key={it.id} to={`/article/${it.id}`} data-hoverbg style={{ display: 'flex', gap: 8, padding: '6px 12px', color: 'var(--tx2)', fontSize: 12, alignItems: 'baseline', borderBottom: '1px solid var(--bd)' }}>
                  <span style={{ flex: '0 0 auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{j + 1}</span>
                  <span style={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cardTitle(it, i18n.language)}</span>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
