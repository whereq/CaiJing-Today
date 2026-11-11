import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Panel, SectionHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { isCn } from '../../lib/format'

// Collapsed teaser height ≈ 3 rows of tiles; expand reveals the full grid.
const COLLAPSED_HEIGHT = 214

export default function SectorHeatmap() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['sectors'], queryFn: api.getSectors })
  const sectors = data ?? []
  const maxAbs = Math.max(1, ...sectors.map((s) => Math.abs(s.change_pct)))

  // Surface the biggest capital moves first (either direction) so the collapsed
  // teaser is the most informative slice rather than an arbitrary API order.
  const ordered = [...sectors].sort((a, b) => Math.abs(b.inflow) - Math.abs(a.inflow))
  const collapsible = ordered.length > 18

  return (
    <Panel>
      <SectionHeader
        accent="var(--up)"
        title={t('nav.sectors')}
        note={t('nav.sectorNote')}
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: 'var(--tx3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: 'var(--up)', display: 'block' }} />{t('nav.upLabel')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: 'var(--down)', display: 'block' }} />{t('nav.downLabel')}</span>
          </span>
        }
      />
      <div style={{ position: 'relative' }}>
        <PanelStatus
          loading={isLoading}
          error={isError}
          empty={!isLoading && !isError && sectors.length === 0}
          onRetry={() => void refetch()}
        />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,88px),1fr))', gap: 1, padding: 1, background: 'var(--bd)',
          maxHeight: collapsible && !expanded ? COLLAPSED_HEIGHT : undefined,
          overflow: collapsible && !expanded ? 'hidden' : undefined,
        }}>
          {ordered.map((s, i) => {
            const up = s.change_pct > 0
            const m = Math.min(1, Math.abs(s.change_pct) / maxAbs)
            // Theme tokens, not hard-coded hex — the light theme uses different
            // up/down colours and the old literals ignored it.
            const base = up ? 'var(--up)' : 'var(--down)'
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '7px 9px',
                minHeight: 62, color: '#fff',
                background: `color-mix(in oklab, ${base} ${(28 + m * 62).toFixed(0)}%, var(--panel3))`,
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.2 }}>{cn ? s.name_cn : s.name_en}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>{(up ? '+' : '') + s.change_pct.toFixed(2)}%</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, opacity: .75, marginTop: 2 }}>{(up ? '+' : '') + s.inflow.toFixed(1)}{cn ? '亿' : 'e8'}</span>
              </div>
            )
          })}
        </div>
        {collapsible && !expanded && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent, var(--panel))',
          }} />
        )}
      </div>
      {collapsible && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%', border: 'none', borderTop: '1px solid var(--bd)', cursor: 'pointer',
            padding: '8px 12px', background: 'var(--panel2)', color: 'var(--tx2)',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {expanded
            ? <>{t('nav.collapseSectors')} ▴</>
            : <>{t('nav.expandSectors')} · {ordered.length} {t('nav.boardsUnit')} ▾</>}
        </button>
      )}
    </Panel>
  )
}
