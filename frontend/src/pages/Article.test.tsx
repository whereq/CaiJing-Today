import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/render'
import Article from './Article'

const { articleMock } = vi.hoisted(() => ({ articleMock: vi.fn() }))

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, api: { ...actual.api, getArticle: articleMock } }
})

const article = {
  id: 1, ref: 'CJ-1', category: 'macro', title: '标题', title_cn: '标题', title_en: 'Title',
  source: 'gdelt', author_cn: '记者', author_en: 'Reporter',
  published_at: new Date().toISOString(), lede_cn: '', lede_en: '',
  body_cn: ['正文'], body_en: ['Body'], stats: [], tags_cn: [], tags_en: [],
  related: [], flash: [],
}

/** An axios-shaped error, as the api client would surface it. */
const httpError = (status: number) => Object.assign(new Error('request failed'), {
  response: { status },
})

describe('Article', () => {
  it('renders the article when it loads', async () => {
    articleMock.mockResolvedValue(article)

    renderWithProviders(<Article />, { route: '/article/1', path: '/article/:id' })

    await waitFor(() => expect(screen.getByText('标题')).toBeInTheDocument())
  })

  it('says "not found" for a 404', async () => {
    articleMock.mockRejectedValue(httpError(404))

    renderWithProviders(<Article />, { route: '/article/999', path: '/article/:id' })

    await waitFor(() => expect(screen.getByText('未找到该文章')).toBeInTheDocument())
  })

  it('does not claim 404 when the request failed for another reason', async () => {
    articleMock.mockRejectedValue(httpError(500))

    renderWithProviders(<Article />, { route: '/article/1', path: '/article/:id' })

    await waitFor(() => expect(screen.getByText('文章加载失败，请稍后重试')).toBeInTheDocument())
    expect(screen.queryByText('未找到该文章')).toBeNull()
  })

  it('treats a non-numeric id as not found without calling the API', async () => {
    articleMock.mockResolvedValue(article)

    renderWithProviders(<Article />, { route: '/article/not-a-number', path: '/article/:id' })

    await waitFor(() => expect(screen.getByText('未找到该文章')).toBeInTheDocument())
    expect(articleMock).not.toHaveBeenCalled()
  })
})
