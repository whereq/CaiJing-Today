import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type RangeKey } from '../../api/client'
import { Panel, SectionHeader, Chip } from '../ui'
import PanelStatus from '../PanelStatus'
import { catById } from '../../lib/categories'
import { cardTitle, cardSource, isCn, timeAgo, heatLabel } from '../../lib/format'

const RANGES: { key: RangeKey; cn: string; en: string }[] = [
  { key: '1h', cn: '1小时', en: '1H' },
  { key: '24h', cn: '24小时', en: '24H' },
  { key: '7d', cn: '本周', en: '7D' },
  { key: '30d', cn: '本月', en: '30D' },
]

export default function HotRanking({ maxHeight }: { maxHeight?: number }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const [range, setRange] = useState<RangeKey>('24h')
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hot', range], queryFn: () => api.getHot(range, 50) })
  const hot = data ?? []

  return (
    <Panel style={{ alignSelf: 'start' }}>
      <SectionHeader
        accent="var(--up)"
        title={t('nav.hot')}
        note={t('top50')}
        right={
          <div style={{ display: 'flex', gap: 1 }}>
            {RANGES.map((r) => (
              <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
                {cn ? r.cn : r.en}
              </Chip>
            ))}
          </div>
        }
      />
      <div style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <PanelStatus
          loading={isLoading}
          error={isError}
          empty={!isLoading && !isError && hot.length === 0}
          onRetry={() => void refetch()}
        />
        {hot.map((h, i) => {
          const c = catById(h.category)
          return (
            <Link
              key={h.id}
              to={`/article/${h.id}`}
              data-hoverbg
              style={{ display: 'flex', gap: 9, alignItems: 'baseline', padding: '7px 12px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' }}
            >
              <span style={{
                flex: '0 0 24px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
                fontWeight: 600, padding: '2px 0', borderRadius: 2,
                background: i < 3 ? 'var(--up)' : 'transparent', color: i < 3 ? '#fff' : 'var(--tx3)',
              }}>{i + 1}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.4 }}>{cardTitle(h, i18n.language)}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 3, fontSize: 10.5, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace", alignItems: 'center' }}>
                  <span style={{ color: 'var(--acc)' }}>{cardSource(h, i18n.language)}</span>
                  <span>{timeAgo(h.published_at, i18n.language, t)}</span>
                  <span style={{ color: c.color, filter: 'brightness(1.35)' }}>{cn ? c.cn : c.en}</span>
                </span>
              </span>
              <span style={{ flex: '0 0 auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'block', width: 34, height: 3, background: 'var(--panel3)', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', inset: '0 auto 0 0', width: `${Math.max(0, Math.min(100, h.heat))}%`, background: 'var(--up)', display: 'block' }} />
                </span>
                {heatLabel(h.heat)}
              </span>
            </Link>
          )
        })}
      </div>
    </Panel>
  )
}
