import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { BareHeader } from '../ui'
import PanelStatus from '../PanelStatus'
import { CATS } from '../../lib/categories'
import { isCn } from '../../lib/format'

export default function CategoryTiles() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  const counts = new Map((data ?? []).map((c) => [c.id, c.count]))

  return (
    <section>
      <BareHeader accent="var(--amber)" title={t('nav.cats')} />
      <PanelStatus loading={isLoading} error={isError} onRetry={() => void refetch()} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,110px),1fr))', gap: 6 }}>
        {CATS.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.id}`}
            style={{ display: 'flex', flexDirection: 'column', padding: 11, minHeight: 88, background: c.color, color: '#fff', borderRadius: 2 }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{c.cn}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', opacity: .8 }}>{c.en}</span>
            {/* A failed count request must not be rendered as "0 articles". */}
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, marginTop: 8, opacity: .9 }}>
              {isError ? '—' : `${counts.get(c.id) ?? 0}${cn ? ' 篇' : ''}`}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
