import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { isCn } from '../lib/format'

const muted = { fontSize: 11.5, color: 'var(--tx3)' } as const

/** Trending keyword chips. Clicking one calls onPick with the keyword text. */
export default function KeywordChips({ numbered, onPick }: { numbered?: boolean; onPick: (kw: string) => void }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { data, isLoading, isError } = useQuery({ queryKey: ['keywords'], queryFn: api.getKeywords })
  const keywords = data ?? []

  // Say what is actually happening — an empty chip strip looks the same whether
  // the collector has no keywords right now or the request failed.
  if (isLoading) return <span style={muted}>{t('state.loading')}</span>
  if (isError) return <span style={muted}>{t('state.error')}</span>
  if (keywords.length === 0) return <span style={muted}>{t('state.empty')}</span>

  return (
    <>
      {keywords.map((k, i) => {
        const label = cn ? k.cn : k.en
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(label)}
            data-hoverbg
            style={{
              padding: '4px 9px', border: '1px solid var(--bd)', background: 'var(--panel2)',
              borderRadius: 2, fontSize: 11.5, color: 'var(--tx2)', fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {numbered ? `${i + 1}. ${label}` : label}
          </button>
        )
      })}
    </>
  )
}
