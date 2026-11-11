import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Panel, SectionHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { isCn } from '../../lib/format'

export default function MiniCharts() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['charts'], queryFn: api.getCharts })
  const charts = data ?? []

  return (
    <Panel>
      <SectionHeader accent="var(--acc)" title={t('nav.charts')} right={<span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{t('nav.delayed')}</span>} />
      <PanelStatus
        loading={isLoading}
        error={isError}
        empty={!isLoading && !isError && charts.length === 0}
        onRetry={() => void refetch()}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))' }}>
        {charts.map((k, idx) => {
          // Theme tokens, not hard-coded hex — the light theme uses different
          // up/down colours and the old literals ignored it.
          const stroke = k.direction > 0 ? 'var(--up)' : 'var(--down)'
          const n = k.points.length
          // A single point has no span to normalise against (n-1 === 0), which
          // produced NaN coordinates; a polyline needs at least two points.
          const pts = n > 1 ? k.points.map((v, i) => `${((i * 100) / (n - 1)).toFixed(1)},${v}`).join(' ') : ''
          return (
            <div key={idx} style={{ padding: '10px 12px', borderRight: '1px solid var(--bd)', borderBottom: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{cn ? k.name_cn : k.name_en}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 19, fontWeight: 600, marginTop: 2 }}>{k.value}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: k.direction > 0 ? 'var(--up)' : 'var(--down)' }}>{k.change}</div>
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 30, marginTop: 6, display: 'block' }}>
                {pts && <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />}
              </svg>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
