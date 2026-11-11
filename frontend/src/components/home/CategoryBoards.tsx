import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BareHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { api } from '../../api/client'
import { CATS, catById } from '../../lib/categories'
import { cardTitle, heatLabel } from '../../lib/format'

const DEFAULT_ORDER = CATS.map((c) => c.id)

export default function CategoryBoards() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['boards'], queryFn: () => api.getBoards('24h') })
  const boards = data ?? {}

  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return }
    const cur = order.slice()
    const from = cur.indexOf(dragId)
    if (from < 0) { setDragId(null); setOverId(null); return }
    cur.splice(from, 1)
    cur.splice(cur.indexOf(targetId), 0, dragId)
    setOrder(cur)
    setDragId(null)
    setOverId(null)
  }

  return (
    <section>
      <BareHeader
        accent="var(--up)"
        title={t('nav.boards')}
        note={t('nav.dragHint')}
        right={
          <button
            onClick={() => setOrder(DEFAULT_ORDER)}
            data-hoverbg
            style={{ padding: '4px 10px', background: 'var(--panel2)', border: '1px solid var(--bd)', borderRadius: 2, color: 'var(--tx2)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, cursor: 'pointer', minHeight: 28 }}
          >
            {t('nav.reset')}
          </button>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 8 }}>
        <PanelStatus loading={isLoading} error={isError} onRetry={() => void refetch()} />
        {order.map((id) => {
          const c = catById(id)
          const items = boards[id] ?? []
          const dragging = dragId === id
          const over = overId === id && dragId !== null && dragId !== id
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(id) }}
              onDragEnter={(e) => { e.preventDefault(); if (dragId && dragId !== id) setOverId(id) }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDrop={(e) => { e.preventDefault(); onDrop(id) }}
              onDragEnd={() => { setDragId(null); setOverId(null) }}
              style={{
                background: 'var(--panel)', border: `1px solid ${over ? 'var(--acc)' : 'var(--bd)'}`, borderRadius: 2,
                display: 'flex', flexDirection: 'column', opacity: dragging ? .35 : 1,
                transform: over ? 'translateY(-2px)' : 'none', transition: 'transform .1s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: c.color, color: '#fff', borderBottom: '1px solid var(--bd)', cursor: 'grab', userSelect: 'none' }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, opacity: .75, cursor: 'grab' }}>⠿</span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.cn}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, opacity: .8 }}>{c.en}</span>
                <Link to={`/category/${id}`} style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#fff', opacity: .85 }}>{t('nav.more')}</Link>
              </div>
              {items.map((it, j) => (
                <Link key={it.id} to={`/article/${it.id}`} data-hoverbg style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 10px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' }}>
                  <span style={{ flex: '0 0 16px', textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: j < 3 ? c.color : 'var(--tx3)', filter: j < 3 ? 'brightness(1.45)' : 'none' }}>{j + 1}</span>
                  <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 12.5, lineHeight: 1.4 }}>{cardTitle(it, i18n.language)}</span>
                  <span style={{ flex: '0 0 auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{heatLabel(it.heat)}</span>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
