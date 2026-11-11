import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import UserAvatar from './icons/UserAvatar'

const btn: CSSProperties = {
  height: 52, minWidth: 46, padding: '0 12px', background: 'none', border: 0,
  color: 'var(--tx2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
}

const item: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px',
  background: 'none', border: 0, borderTop: '1px solid var(--bd)', color: 'var(--tx)',
  cursor: 'pointer', fontSize: 12.5, textAlign: 'left',
}

/** Desktop avatar button + dropdown (sign in / up / out). */
export default function UserMenu() {
  const { t } = useTranslation()
  const { isAuthenticated, displayName, avatar, isAdmin, login, register, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={isAuthenticated ? (displayName || t('auth.signedIn')) : t('auth.signIn')}
        style={{ ...btn, background: open ? 'var(--panel2)' : 'none' }}
        data-hoverbg
      >
        <UserAvatar avatar={isAuthenticated ? avatar : null} isAuthenticated={isAuthenticated} size={26} />
        <span style={{ fontSize: 9, color: 'var(--tx3)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 52, right: 0, minWidth: 208, background: 'var(--panel)',
          border: '1px solid var(--bd2)', borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,.28)',
          zIndex: 60, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: 'var(--panel2)' }}>
            <UserAvatar avatar={isAuthenticated ? avatar : null} isAuthenticated={isAuthenticated} size={30} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isAuthenticated ? (displayName || t('auth.signedIn')) : t('auth.guest')}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--tx3)' }}>
                {isAuthenticated ? (isAdmin ? t('auth.admin') : t('auth.signedIn')) : t('auth.browsingAsGuest')}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <button onClick={() => { logout(); close() }} style={{ ...item, color: 'var(--down)' }} data-hoverbg>
              ↳ {t('auth.signOut')}
            </button>
          ) : (
            <>
              <button onClick={() => { login(); close() }} style={item} data-hoverbg>→ {t('auth.signIn')}</button>
              <button onClick={() => { register(); close() }} style={item} data-hoverbg>＋ {t('auth.signUp')}</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
