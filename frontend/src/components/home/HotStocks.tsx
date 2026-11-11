import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Panel, SectionHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { isCn } from '../../lib/format'

const mono = "'IBM Plex Mono',monospace"

// Market chip colour (cn=red per the Chinese convention, hk amber, us blue).
const MARKET_COLOR: Record<string, string> = { cn: 'var(--up)', hk: 'var(--amber)', us: 'var(--acc)' }

export default function HotStocks({ maxHeight }: { maxHeight?: number }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hotstocks'], queryFn: api.getHotStocks })
  const rows = data ?? []

  // Hide the panel entirely until the collector ships cj_hot_stock (empty → null).
  // A failed REQUEST is a different fact, so it gets a visible state instead of
  // silently disappearing.
  if (!isError && rows.length === 0) return null

  return (
    <Panel>
      <SectionHeader accent="var(--up)" title={t('nav.hotStocks')} note={t('nav.hotStocksNote')} />
      <PanelStatus
        loading={isLoading}
        error={isError}
        empty={!isLoading && !isError && rows.length === 0}
        onRetry={() => void refetch()}
      />
      <div style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        {rows.map((s, i) => {
          const chip = MARKET_COLOR[s.market] ?? 'var(--tx3)'
          const inner = (
            <>
              <span style={{
                flex: '0 0 24px', textAlign: 'center', fontFamily: mono, fontSize: 12, fontWeight: 600,
                padding: '2px 0', borderRadius: 2,
                background: i < 3 ? 'var(--up)' : 'transparent', color: i < 3 ? '#fff' : 'var(--tx3)',
              }}>{s.rank || i + 1}</span>
              <span style={{ flex: '0 0 auto', padding: '2px 5px', borderRadius: 2, background: chip, color: '#fff', fontFamily: mono, fontSize: 9.5, fontWeight: 600 }}>{s.symbol}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cn ? s.name_cn : (s.name_en || s.name_cn)}
                {s.trend > 0 && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--up)', fontFamily: mono }}>{t('nav.trendNew')}</span>}
              </span>
              <span style={{ flex: '0 0 56px', textAlign: 'right', fontFamily: mono, fontSize: 11.5, color: s.change_pct > 0 ? 'var(--up)' : 'var(--down)' }}>
                {(s.change_pct > 0 ? '+' : '') + s.change_pct.toFixed(2)}%
              </span>
              <span style={{ flex: '0 0 auto', fontFamily: mono, fontSize: 10.5, color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'block', width: 34, height: 3, background: 'var(--panel3)', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', inset: '0 auto 0 0', width: `${Math.max(0, Math.min(100, s.heat))}%`, background: 'var(--up)', display: 'block' }} />
                </span>
                {s.heat.toFixed(0)}
              </span>
            </>
          )
          const style = { display: 'flex', gap: 9, alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' } as const
          return s.url
            ? <a key={i} href={s.url} target="_blank" rel="noreferrer" data-hoverbg style={style}>{inner}</a>
            : <div key={i} style={style}>{inner}</div>
        })}
      </div>
    </Panel>
  )
}
