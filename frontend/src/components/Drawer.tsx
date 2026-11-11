import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CATS } from '../lib/categories'
import { isCn } from '../lib/format'
import { useAuth } from '../auth/useAuth'
import UserAvatar from './icons/UserAvatar'

export default function Drawer({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { isAuthenticated, displayName, avatar, isAdmin, login, register, logout } = useAuth()

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 90, animation: 'fade .12s ease-out' }}>
      <nav
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 270, maxWidth: '82vw', height: '100%', background: 'var(--panel)',
          borderRight: '1px solid var(--bd2)', animation: 'slidein .16s ease-out',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 14, borderBottom: '1px solid var(--bd)', background: 'var(--panel2)' }}>
          <span style={{ width: 26, height: 26, background: 'var(--acc2)', display: 'grid', placeItems: 'center', borderRadius: 2, color: '#fff', fontWeight: 700, fontFamily: "'Noto Serif SC',serif" }}>财</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>财经今日</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 34, height: 34, background: 'none', border: '1px solid var(--bd)', borderRadius: 2, color: 'var(--tx2)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14, borderBottom: '1px solid var(--bd)' }}>
          <UserAvatar avatar={isAuthenticated ? avatar : null} isAuthenticated={isAuthenticated} size={38} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isAuthenticated ? (displayName || t('auth.signedIn')) : t('auth.guest')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
              {isAuthenticated ? (isAdmin ? t('auth.admin') : t('auth.signedIn')) : t('auth.browsingAsGuest')}
            </span>
          </div>
        </div>
        {isAuthenticated ? (
          <button onClick={() => { logout(); onClose() }} style={{ width: '100%', padding: '0 14px', minHeight: 46, display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 0, borderBottom: '1px solid var(--bd)', color: 'var(--down)', fontSize: 13.5, cursor: 'pointer', textAlign: 'left' }}>
            ↳ {t('auth.signOut')}
          </button>
        ) : (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)' }}>
            <button onClick={() => { login(); onClose() }} style={{ flex: 1, minHeight: 46, background: 'none', border: 0, borderRight: '1px solid var(--bd)', color: 'var(--tx)', fontSize: 13.5, cursor: 'pointer' }}>
              → {t('auth.signIn')}
            </button>
            <button onClick={() => { register(); onClose() }} style={{ flex: 1, minHeight: 46, background: 'none', border: 0, color: 'var(--tx2)', fontSize: 13.5, cursor: 'pointer' }}>
              ＋ {t('auth.signUp')}
            </button>
          </div>
        )}

        <Link to="/" onClick={onClose} style={{ padding: '0 14px', minHeight: 46, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--bd)', color: 'var(--tx)', fontSize: 13.5, fontWeight: 600 }}>
          {t('nav.home')}
        </Link>
        {CATS.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.id}`}
            onClick={onClose}
            data-hoverbg
            style={{ padding: '0 14px', minHeight: 46, display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--bd)', color: 'var(--tx)', fontSize: 13.5 }}
          >
            <span style={{ width: 12, height: 12, background: c.color, display: 'block', borderRadius: 2 }} />
            <span>{cn ? c.cn : c.en}</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{cn ? c.en : c.cn}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
