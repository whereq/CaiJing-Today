import { useTranslation } from 'react-i18next'
import { useClock } from '../lib/hooks'
import { SOURCES, sourceLabel } from '../lib/sources'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const { clock } = useClock()

  return (
    <footer style={{ flex: '0 0 auto', borderTop: '1px solid var(--bd)', background: 'var(--panel)', zIndex: 40 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', height: 34,
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--tx3)',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        <span style={{ color: 'var(--tx2)', fontWeight: 600 }}>CaiJing Today</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, background: 'var(--down)', display: 'block', borderRadius: '50%' }} />
          {t('nav.live')}
        </span>
        {/* Real source credits. The design's five footer links pointed at
            "#" — About / Sources / Data / Contact have no pages behind them,
            so they were decorative. This credits the sources the feed really
            comes from instead, and links only to a page that exists. */}
        <span>
          {t('foot.sources')}: {SOURCES.map((s) => sourceLabel(s.id, i18n.language)).join(' · ')}
        </span>
        <a href="/api-docs" style={{ color: 'var(--tx3)' }}>{t('foot.api')}</a>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span>{t('nav.disclaimer')}</span>
          <span style={{ color: 'var(--tx2)' }}>{clock}</span>
        </span>
      </div>
    </footer>
  )
}
