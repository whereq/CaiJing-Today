import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Panel, SectionHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { isCn } from '../../lib/format'

export default function GlobalMarkets({ twoColumn = false, maxHeight }: { twoColumn?: boolean; maxHeight?: number }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['quotes'], queryFn: api.getQuotes })
  const quotes = data ?? []

  return (
    <Panel>
      <SectionHeader accent="var(--amber)" title={t('nav.global')} right={<span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{t('nav.delayed')}</span>} />
      <div style={{ ...(twoColumn ? { display: 'grid', gridTemplateColumns: '1fr 1fr' } : {}), maxHeight, overflowY: maxHeight ? 'auto' : undefined }}>
        <PanelStatus
          loading={isLoading}
          error={isError}
          empty={!isLoading && !isError && quotes.length === 0}
          onRetry={() => void refetch()}
        />
        {quotes.map((q, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid var(--bd)' }}>
            <span style={{ flex: '1 1 auto', fontSize: 12, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cn ? q.name_cn : q.name_en}</span>
            <span style={{ flex: '0 0 auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--tx)' }}>{q.value}</span>
            <span style={{ flex: '0 0 62px', textAlign: 'right', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: q.direction > 0 ? 'var(--up)' : 'var(--down)' }}>{q.change}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
