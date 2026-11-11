import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Panel } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { useClock } from '../../lib/hooks'
import { isCn } from '../../lib/format'

export default function FlashFeed({ maxHeight = 420, limit = 10 }: { maxHeight?: number; limit?: number }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { clock } = useClock()
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['flash', limit], queryFn: () => api.getFlash(limit) })
  const items = data ?? []

  return (
    <Panel>
      <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--panel2)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--up)', animation: 'bl 1.4s infinite', display: 'block' }} />
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{t('nav.flash')}</h2>
        <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{clock}</span>
      </div>
      <div style={{ maxHeight, overflowY: 'auto' }}>
        <PanelStatus
          loading={isLoading}
          error={isError}
          empty={!isLoading && !isError && items.length === 0}
          onRetry={() => void refetch()}
        />
        {items.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 12px', borderBottom: '1px solid var(--bd)' }}>
            <span style={{ flex: '0 0 auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--amber)', paddingTop: 2 }}>{f.time}</span>
            <span style={{ flex: '1 1 auto', fontSize: 12.5, color: 'var(--tx)' }}>{cn ? (f.text_cn || f.text) : (f.text_en || f.text)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
