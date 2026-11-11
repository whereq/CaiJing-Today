import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Panel, SectionHeader } from '../components/ui'
import { catById } from '../lib/categories'
import { cardTitle, isCn, timeAgo } from '../lib/format'
import { useWindowWidth } from '../lib/hooks'

export default function Article() {
  const { t, i18n } = useTranslation()
  const cn = isCn(i18n.language)
  const { id = '0' } = useParams()
  const w = useWindowWidth()
  const narrow = w < 1300

  const articleId = Number(id)
  const invalidId = !Number.isInteger(articleId)

  const { data: a, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.getArticle(articleId),
    enabled: !invalidId,
    retry: false,
  })

  // A missing article and a broken request are different facts — saying "404"
  // for a 500 (or a dead network) misleads the reader about what happened.
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  const missing = invalidId || (isError && status === 404) || (!isLoading && !isError && !a)

  if (isLoading) return <div style={{ padding: 24, color: 'var(--tx3)' }}>{t('state.loading')}</div>
  if (missing) {
    return (
      <div style={{ padding: 24, color: 'var(--tx3)' }}>
        {t('state.notFound')}{' '}
        <Link to="/" style={{ color: 'var(--acc)' }}>{t('nav.home')}</Link>
      </div>
    )
  }
  if (isError || !a) {
    return (
      <div style={{ padding: 24, color: 'var(--tx3)' }}>
        {t('state.articleError')}{' '}
        <button
          onClick={() => void refetch()}
          style={{ padding: '4px 10px', background: 'var(--panel2)', border: '1px solid var(--bd2)', borderRadius: 2, color: 'var(--tx2)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}
        >
          {t('state.retry')}
        </button>
      </div>
    )
  }

  const c = catById(a.category)
  const title = cn ? (a.title_cn || a.title) : (a.title_en || a.title)
  const lede = cn ? a.lede_cn : a.lede_en
  const body = cn ? a.body_cn : a.body_en
  const tags = cn ? a.tags_cn : a.tags_en
  const author = cn ? a.author_cn : a.author_en

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: '0 auto', display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'minmax(0,2fr) minmax(320px,1fr)', gap: 10, alignItems: 'start' }}>
      <article style={{ background: 'var(--panel)', border: '1px solid var(--bd)', borderRadius: 2 }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--panel2)', display: 'flex', gap: 8, alignItems: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--tx3)', flexWrap: 'wrap' }}>
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <Link to={`/category/${a.category}`}>{cn ? c.cn : c.en}</Link><span>/</span>
          <span style={{ color: 'var(--tx2)' }}>{a.ref}</span>
        </div>
        <div style={{ padding: '22px 26px 18px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ padding: '3px 9px', borderRadius: 2, background: c.color, color: '#fff', fontSize: 11, fontWeight: 600 }}>{cn ? c.cn : c.en}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--tx3)' }}>
              {timeAgo(a.published_at, i18n.language, t)} · {a.source} · {author}
            </span>
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Noto Serif SC',serif", fontSize: 'clamp(24px,3.4vw,36px)', fontWeight: 700, lineHeight: 1.28, letterSpacing: '-.01em' }}>{title}</h1>
          {lede && <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.7, color: 'var(--tx2)', borderLeft: '3px solid var(--acc)', paddingLeft: 12 }}>{lede}</p>}

          {a.stats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, margin: '18px 0', border: '1px solid var(--bd)' }}>
              {a.stats.map((s, i) => (
                <div key={i} style={{ flex: '1 1 120px', padding: '9px 12px', background: 'var(--panel2)', borderRight: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: "'IBM Plex Mono',monospace" }}>{cn ? s.key_cn : s.key_en}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 600, marginTop: 2, color: s.up ? 'var(--up)' : 'var(--tx)' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {body.map((p, i) => (
            <p key={i} style={{ margin: '0 0 15px', fontSize: 15, lineHeight: 1.85, color: 'var(--tx)' }}>{p}</p>
          ))}

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--bd)' }}>
              {tags.map((k, i) => (
                <span key={i} style={{ padding: '4px 9px', background: 'var(--panel2)', border: '1px solid var(--bd)', borderRadius: 2, fontSize: 11, color: 'var(--tx2)' }}>{k}</span>
              ))}
            </div>
          )}
        </div>
      </article>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Panel>
          <SectionHeader accent="var(--up)" title={t('nav.related')} />
          {a.related.map((r) => (
            <Link key={r.id} to={`/article/${r.id}`} data-hoverbg style={{ display: 'block', padding: '9px 12px', borderBottom: '1px solid var(--bd)', color: 'var(--tx)' }}>
              <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.45 }}>{cardTitle(r, i18n.language)}</span>
              <span style={{ display: 'block', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>{r.source} · {timeAgo(r.published_at, i18n.language, t)}</span>
            </Link>
          ))}
        </Panel>
        <Panel>
          <SectionHeader accent="var(--acc)" title={t('nav.flash')} />
          {a.flash.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 12px', borderBottom: '1px solid var(--bd)' }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: 'var(--amber)' }}>{f.time}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--tx2)' }}>{cn ? (f.text_cn || f.text) : (f.text_en || f.text)}</span>
            </div>
          ))}
        </Panel>
      </aside>
    </div>
  )
}
