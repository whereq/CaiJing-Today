import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import KeywordChips from './KeywordChips'

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (q?: string) => {
    const term = (q ?? query).trim()
    onClose()
    navigate(`/search${term ? `?q=${encodeURIComponent(term)}` : ''}`)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 80,
        animation: 'fade .12s ease-out', display: 'flex', justifyContent: 'center', padding: '70px 14px',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 620, background: 'var(--panel)', border: '1px solid var(--bd2)',
        borderRadius: 2, height: 'max-content',
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); submit() }}
          style={{ display: 'flex', borderBottom: '1px solid var(--bd)' }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('nav.searchPh')}
            style={{
              flex: 1, padding: 14, background: 'transparent', border: 0, outline: 'none',
              color: 'var(--tx)', fontFamily: 'inherit', fontSize: 15, minHeight: 48,
            }}
          />
          <button type="submit" style={{
            padding: '0 20px', background: 'var(--acc2)', border: 0, color: '#fff',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {t('nav.search')}
          </button>
        </form>
        <div style={{ padding: '11px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace" }}>{t('nav.hotSearch')}</span>
          <KeywordChips onPick={(kw) => submit(kw)} />
        </div>
      </div>
    </div>
  )
}
