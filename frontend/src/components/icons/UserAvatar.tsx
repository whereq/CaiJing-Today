/**
 * Smart user avatar.
 * Priority: explicit avatar (SSO picture) → anonymous default (signed-in, no
 * picture) → stable random anonymous pose (guest).
 */
import { guestAvatar, ANON_DEFAULT } from '../../utils/avatars'

interface Props {
  avatar?: string | null
  isAuthenticated: boolean
  size?: number
}

export default function UserAvatar({ avatar, isAuthenticated, size = 24 }: Props) {
  const src = avatar || (isAuthenticated ? ANON_DEFAULT : guestAvatar())
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        border: '1px solid var(--bd2)', flexShrink: 0, background: 'var(--panel2)',
        display: 'block',
      }}
    />
  )
}
