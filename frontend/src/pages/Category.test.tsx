import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import Category from './Category'

const { byCategoryMock, latestMock } = vi.hoisted(() => ({
  byCategoryMock: vi.fn(),
  latestMock: vi.fn(),
}))

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    api: { ...actual.api, getByCategory: byCategoryMock, getLatest: latestMock },
  }
})

const card = (id: number) => ({
  id, title: `标题 ${id}`, title_cn: `标题 ${id}`, title_en: `Title ${id}`,
  summary_cn: '', summary_en: '', source: 'gdelt', category: 'macro',
  published_at: new Date().toISOString(), heat: 50,
})

const page = (n: number) => Array.from({ length: n }, (_, i) => card(i + 1))

describe('Category', () => {
  it('pages with `offset` instead of growing `limit`', async () => {
    // The backend caps `limit` at 200; growing it past that returns HTTP 422.
    byCategoryMock.mockResolvedValue(page(18))
    latestMock.mockResolvedValue(page(4))

    const user = userEvent.setup()
    renderWithProviders(<Category />, { route: '/category/macro', path: '/category/:cat' })

    await waitFor(() => expect(byCategoryMock).toHaveBeenCalled())
    expect(byCategoryMock).toHaveBeenCalledWith('macro', expect.objectContaining({ limit: 18, offset: 0 }))

    // Wait for the first page to render before asking for the next one.
    await waitFor(() => expect(screen.getByRole('button', { name: /加载更多/ })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /加载更多/ }))

    await waitFor(() => expect(byCategoryMock).toHaveBeenCalledTimes(2))
    expect(byCategoryMock).toHaveBeenLastCalledWith('macro', expect.objectContaining({ limit: 18, offset: 18 }))

    // No call may ask for more than the backend's maximum page size.
    for (const call of byCategoryMock.mock.calls) {
      expect(call[1].limit).toBeLessThanOrEqual(200)
    }
  })

  it('offers the source ids the feed actually contains', async () => {
    byCategoryMock.mockResolvedValue(page(2))
    latestMock.mockResolvedValue([
      { ...card(1), source: 'gdelt' },
      { ...card(2), source: 'polygon' },
    ])

    renderWithProviders(<Category />, { route: '/category/macro', path: '/category/:cat' })

    await waitFor(() => expect(screen.getByText('GDELT 全球新闻')).toBeInTheDocument())
    expect(screen.getByText('Polygon.io')).toBeInTheDocument()
  })

  it('filters by the raw source id the backend matches on', async () => {
    byCategoryMock.mockResolvedValue(page(2))
    latestMock.mockResolvedValue([
      { ...card(1), source: 'gdelt' },
      { ...card(2), source: 'polygon' },
    ])

    const user = userEvent.setup()
    renderWithProviders(<Category />, { route: '/category/macro', path: '/category/:cat' })

    await waitFor(() => expect(screen.getByText('GDELT 全球新闻')).toBeInTheDocument())
    await user.click(screen.getByText('GDELT 全球新闻'))

    await waitFor(() =>
      expect(byCategoryMock).toHaveBeenCalledWith('macro', expect.objectContaining({ source: 'gdelt' })),
    )
  })

  it('says "no more" once the feed is exhausted', async () => {
    byCategoryMock.mockResolvedValue(page(3))
    latestMock.mockResolvedValue(page(1))

    renderWithProviders(<Category />, { route: '/category/macro', path: '/category/:cat' })

    await waitFor(() => expect(screen.getByText('没有更多了')).toBeInTheDocument())
  })
})
