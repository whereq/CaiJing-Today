import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Panel, BareHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { isCn } from '../../lib/format'

const mono = "'IBM Plex Mono',monospace"
const chgStyle = (v: number): CSSProperties => ({
  flex: '0 0 56px', textAlign: 'right', fontFamily: mono, fontSize: 11,
  color: v > 0 ? 'var(--up)' : 'var(--down)',
})
const pctLabel = (v: number, digits = 2) => (v > 0 ? '+' : '') + v.toFixed(digits) + '%'

function PanelHead({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ padding: '8px 11px', borderBottom: '1px solid var(--bd)', background: 'var(--panel2)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{title}</span>
      <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 9.5, color: 'var(--tx3)' }}>{note}</span>
    </div>
  )
}

export default function CryptoZone() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['crypto'], queryFn: api.getCrypto })

  return (
    <section>
      <BareHeader accent="#7a4bbd" title={t('nav.cryptoZone')} note={t('nav.cryptoNote')} />
      <PanelStatus loading={isLoading} error={isError} onRetry={() => void refetch()} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,270px),1fr))', gap: 8, alignItems: 'start' }}>
        {/* Majors */}
        <Panel>
          <PanelHead title={t('nav.majors')} note="USDT" />
          {(data?.coins ?? []).map((c) => (
            <div key={c.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 11px', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ flex: '0 0 auto', padding: '2px 5px', borderRadius: 2, background: c.color, color: '#fff', fontFamily: mono, fontSize: 9.5, fontWeight: 600 }}>{c.symbol}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 11.5, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cn ? c.name_cn : c.name_en}</span>
              <span style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--tx)' }}>{c.price}</span>
              <span style={chgStyle(c.change_pct)}>{pctLabel(c.change_pct)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 1, background: 'var(--bd)' }}>
            {(data?.stats ?? []).map((s, i) => (
              <div key={i} style={{ flex: '1 1 0', padding: '7px 11px', background: 'var(--panel2)' }}>
                <div style={{ fontFamily: mono, fontSize: 9.5, color: 'var(--tx3)' }}>{cn ? s.key_cn : s.key_en}</div>
                <div style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, marginTop: 2, color: s.up ? 'var(--up)' : 'var(--tx)' }}>{cn ? s.value_cn : s.value_en}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Chains */}
        <Panel>
          <PanelHead title={t('nav.chains')} note="TVL · GWEI" />
          {(data?.chains ?? []).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 11px', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ flex: '0 0 auto', width: 9, height: 9, borderRadius: 2, background: c.color, display: 'block' }} />
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 11.5, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cn ? c.name_cn : c.name_en}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--tx)' }}>{c.tvl}</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--tx3)', flex: '0 0 40px', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.gas}</span>
              <span style={{ ...chgStyle(c.change_pct), flex: '0 0 54px' }}>{pctLabel(c.change_pct)}</span>
            </div>
          ))}
        </Panel>

        {/* New listings */}
        <Panel>
          <PanelHead title={t('nav.newTokens')} note={t('nav.since')} />
          {(data?.new_tokens ?? []).map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 11px', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ flex: '0 0 auto', padding: '2px 5px', borderRadius: 2, background: 'var(--panel3)', color: 'var(--tx)', fontFamily: mono, fontSize: 9.5, fontWeight: 600 }}>{n.symbol}</span>
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 11, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cn ? n.venue_cn : n.venue_en}</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--tx3)' }}>{n.date}</span>
              <span style={{ ...chgStyle(n.change_pct), flex: '0 0 54px' }}>{pctLabel(n.change_pct, 1)}</span>
            </div>
          ))}
        </Panel>
      </div>
    </section>
  )
}
