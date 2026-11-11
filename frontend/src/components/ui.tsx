import type { CSSProperties, ReactNode } from 'react'

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{ background: 'var(--panel)', border: '1px solid var(--bd)', borderRadius: 2, ...style }}>
      {children}
    </section>
  )
}

export function SectionHeader({
  accent, title, note, right,
}: { accent: string; title: string; note?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      borderBottom: '1px solid var(--bd)', background: 'var(--panel2)', flexWrap: 'wrap',
    }}>
      <span style={{ width: 3, height: 14, background: accent, display: 'block' }} />
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.02em' }}>{title}</h2>
      {note && (
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{note}</span>
      )}
      {right && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  )
}

/** Bare section title used outside panels (design's inline h2 rows). */
export function BareHeader({ accent, title, note, right }: { accent: string; title: string; note?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 7px 0', flexWrap: 'wrap' }}>
      <span style={{ width: 3, height: 14, background: accent, display: 'block' }} />
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</h2>
      {note && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)' }}>{note}</span>}
      {right && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  )
}

export function Chip({
  active, children, onClick,
}: { active: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', borderRadius: 2, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
        cursor: 'pointer', minHeight: 30,
        border: `1px solid ${active ? 'var(--acc)' : 'var(--bd)'}`,
        background: active ? 'var(--acc2)' : 'var(--panel2)',
        color: active ? '#fff' : 'var(--tx2)',
      }}
    >
      {children}
    </button>
  )
}
