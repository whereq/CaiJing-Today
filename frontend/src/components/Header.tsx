import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { CATS } from '../lib/categories'
import { isCn } from '../lib/format'
import Ticker from './Ticker'
import UserMenu from './UserMenu'

const btn: CSSProperties = {
  height: 52, minWidth: 46, padding: '0 12px', background: 'none', border: 0,
  borderRight: '1px solid var(--bd)', color: 'var(--tx2)', cursor: 'pointer', fontSize: 14,
}

export default function Header({
  mobile, onOpenSearch, onToggleDrawer,
}: { mobile: boolean; onOpenSearch: () => void; onToggleDrawer: () => void }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { theme, toggleTheme } = useTheme()
  const { cat: activeCat } = useParams()

  const toggleLang = () => i18n.changeLanguage(cn ? 'en' : 'zh')

  return (
    <header style={{ flex: '0 0 auto', borderBottom: '1px solid var(--bd)', background: 'var(--panel)', zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', height: 52 }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px',
          borderRight: '1px solid var(--bd)', flex: '0 0 auto', color: 'var(--tx)',
        }}>
          <span style={{
            width: 26, height: 26, background: 'var(--acc2)', display: 'grid', placeItems: 'center',
            borderRadius: 2, fontWeight: 700, fontSize: 15, color: '#fff', fontFamily: "'Noto Serif SC',serif",
          }}>财</span>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '.02em' }}>财经今日</span>
            <span style={{ fontSize: 9, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '.06em' }}>CAIJING TODAY</span>
          </span>
        </Link>

        {!mobile && (
          <nav className="cj-nav" style={{
            display: 'flex', alignItems: 'stretch', overflowX: 'auto', flex: '1 1 auto',
            minWidth: 0, scrollbarWidth: 'none',
          }}>
            {CATS.map((c) => {
              const active = activeCat === c.id
              return (
                <Link key={c.id} to={`/category/${c.id}`} data-hoverbg style={{
                  display: 'flex', alignItems: 'center', padding: '0 11px', fontSize: 12.5,
                  color: active ? 'var(--tx)' : 'var(--tx2)',
                  borderBottom: `2px solid ${active ? c.color : 'transparent'}`,
                  whiteSpace: 'nowrap', flex: '0 0 auto',
                }}>
                  {cn ? c.cn : c.en}
                </Link>
              )
            })}
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', flex: '0 0 auto', borderLeft: '1px solid var(--bd)' }}>
          <button onClick={onOpenSearch} title={t('nav.search')} style={btn} data-hoverbg>⌕</button>
          <button onClick={toggleLang} style={{ ...btn, fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }} data-hoverbg>
            {cn ? 'EN' : '中文'}
          </button>
          <button onClick={toggleTheme} style={{ ...btn, borderRight: '1px solid var(--bd)' }} data-hoverbg>
            {theme === 'dark' ? '◐' : '◑'}
          </button>
          {mobile ? (
            <button onClick={onToggleDrawer} style={{ ...btn, borderRight: 0, fontSize: 19, color: 'var(--tx)' }} data-hoverbg>≡</button>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
      <Ticker />
    </header>
  )
}
