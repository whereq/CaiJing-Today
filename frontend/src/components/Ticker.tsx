import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api, type Quote } from '../api/client'
import { isCn } from '../lib/format'

export default function Ticker() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError } = useQuery({ queryKey: ['quotes'], queryFn: api.getQuotes })
  const quotes: Quote[] = data ?? []
  const loop = quotes.concat(quotes)

  // A blank ticker strip reads as "no quotes exist"; say which it is.
  if (isLoading || isError || quotes.length === 0) {
    return (
      <div style={{ height: 28, borderTop: '1px solid var(--bd)', background: 'var(--panel2)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--tx3)' }}>
          {isLoading ? t('state.loading') : isError ? t('state.error') : t('state.empty')}
        </span>
      </div>
    )
  }

  return (
    <div style={{ height: 28, borderTop: '1px solid var(--bd)', background: 'var(--panel2)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', width: '200%', animation: 'tk 60s linear infinite', height: '100%' }}>
        {loop.map((q, i) => (
          <span key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px',
            borderRight: '1px solid var(--bd)', flex: '0 0 auto',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--tx2)' }}>{cn ? q.name_cn : q.name_en}</span>
            <span style={{ color: 'var(--tx)' }}>{q.value}</span>
            <span style={{ color: q.direction > 0 ? 'var(--up)' : 'var(--down)' }}>{q.change}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
