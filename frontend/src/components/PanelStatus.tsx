import { useTranslation } from 'react-i18next'

/** Loading / error / empty state for a data panel.
 *
 *  Without this, a failed request renders as an empty list — indistinguishable
 *  from "the collector has nothing right now", which is a different (and often
 *  wrong) statement. Every panel that reads the API should say which of the
 *  three it is showing.
 *
 *  Renders nothing when there is data, so it can be dropped inline before the
 *  content list.
 */
export default function PanelStatus({
  loading, error, empty, onRetry,
}: {
  loading?: boolean
  error?: boolean
  empty?: boolean
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div style={{ padding: '18px 12px', color: 'var(--tx3)', fontSize: 12 }}>{t('state.loading')}</div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '18px 12px', color: 'var(--tx3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{t('state.error')}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '4px 10px', background: 'var(--panel2)', border: '1px solid var(--bd2)',
              borderRadius: 2, color: 'var(--tx2)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
            }}
          >
            {t('state.retry')}
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div style={{ padding: '18px 12px', color: 'var(--tx3)', fontSize: 12 }}>{t('state.empty')}</div>
    )
  }

  return null
}
