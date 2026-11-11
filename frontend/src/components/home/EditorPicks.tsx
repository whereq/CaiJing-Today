import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import PanelStatus from '../PanelStatus'
import { catById } from '../../lib/categories'
import { cardTitle, cardSource, isCn, timeAgo } from '../../lib/format'

export default function EditorPicks() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hot', '24h'], queryFn: () => api.getHot('24h', 50) })
  const picks = [data?.[0], data?.[4], data?.[8]].filter(Boolean).slice(0, 3)

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: 6 }}>
      <PanelStatus
        loading={isLoading}
        error={isError}
        empty={!isLoading && !isError && picks.length === 0}
        onRetry={() => void refetch()}
      />
      {picks.map((p, n) => {
        const card = p!
        const c = catById(card.category)
        const primary = n === 0
        return (
          <Link
            key={card.id}
            to={`/article/${card.id}`}
            style={{
              display: 'flex', flexDirection: 'column', minHeight: 150, padding: 13,
              background: primary ? c.color : 'var(--panel)',
              border: `1px solid ${primary ? c.color : 'var(--bd)'}`,
              color: primary ? '#fff' : 'var(--tx)', borderRadius: 2,
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '.1em', opacity: .85 }}>
              {t('nav.editorPick')} / {cn ? c.cn : c.en}
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, marginTop: 'auto' }}>{cardTitle(card, i18n.language)}</span>
            <span style={{ fontSize: 11, opacity: .85, marginTop: 6 }}>
              {cardSource(card, i18n.language)} · {timeAgo(card.published_at, i18n.language, t)}
            </span>
          </Link>
        )
      })}
    </section>
  )
}
