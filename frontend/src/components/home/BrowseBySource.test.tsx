import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import BrowseBySource from './BrowseBySource'

const { latestMock } = vi.hoisted(() => ({ latestMock: vi.fn() }))

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../api/client')>('../../api/client')
  return { ...actual, api: { ...actual.api, getLatest: latestMock } }
})

const card = (id: number, source: string, title: string) => ({
  id, title, title_cn: title, title_en: title,
  summary_cn: '', summary_en: '', source, category: 'macro',
  published_at: new Date().toISOString(), heat: 50,
})

describe('BrowseBySource', () => {
  it('groups each headline under the source it actually came from', async () => {
    latestMock.mockResolvedValue([
      card(1, 'gdelt', '来自 GDELT 的标题'),
      card(2, 'polygon', '来自 Polygon 的标题'),
    ])

    renderWithProviders(<BrowseBySource />)

    await waitFor(() => expect(screen.getByText('GDELT 全球新闻')).toBeInTheDocument())

    const gdeltColumn = screen.getByText('GDELT 全球新闻').parentElement?.parentElement
    const polygonColumn = screen.getByText('Polygon.io').parentElement?.parentElement
    expect(gdeltColumn).toBeTruthy()
    expect(polygonColumn).toBeTruthy()

    // The old implementation sliced one flat pool arithmetically, so headlines
    // appeared under outlet names they never came from.
    expect(within(gdeltColumn as HTMLElement).getByText('来自 GDELT 的标题')).toBeInTheDocument()
    expect(within(gdeltColumn as HTMLElement).queryByText('来自 Polygon 的标题')).toBeNull()
    expect(within(polygonColumn as HTMLElement).getByText('来自 Polygon 的标题')).toBeInTheDocument()
    expect(within(polygonColumn as HTMLElement).queryByText('来自 GDELT 的标题')).toBeNull()
  })

  it('counts the sources it is showing', async () => {
    latestMock.mockResolvedValue([
      card(1, 'gdelt', 'a'),
      card(2, 'polygon', 'b'),
      card(3, 'rss', 'c'),
    ])

    renderWithProviders(<BrowseBySource />)

    await waitFor(() => expect(screen.getByText('3 个来源')).toBeInTheDocument())
  })

  it('reports a failed request instead of showing an empty browser', async () => {
    latestMock.mockRejectedValue(new Error('boom'))

    renderWithProviders(<BrowseBySource />)

    await waitFor(() => expect(screen.getByText('数据加载失败')).toBeInTheDocument())
  })
})
