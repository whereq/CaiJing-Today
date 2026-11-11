import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/render'
import Search from './Search'

const { searchMock } = vi.hoisted(() => ({ searchMock: vi.fn() }))

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, api: { ...actual.api, search: searchMock } }
})

const card = (id: number) => ({
  id, title: `标题 ${id}`, title_cn: `标题 ${id}`, title_en: `Title ${id}`,
  summary_cn: '', summary_en: '', source: 'gdelt', category: 'macro',
  published_at: new Date().toISOString(), heat: 50,
})

describe('Search', () => {
  it('reports the total the API returned', async () => {
    searchMock.mockResolvedValue({ results: [card(1)], total: 7, elapsedMs: 210 })

    renderWithProviders(<Search />, { route: '/search?q=央行' })

    await waitFor(() => expect(screen.getByText(/7 条结果/)).toBeInTheDocument())
    // The old header claimed "about 1,284 results" no matter what came back.
    expect(screen.queryByText(/1,284/)).toBeNull()
  })

  it('says how many of the matches are actually shown when truncated', async () => {
    searchMock.mockResolvedValue({ results: [card(1), card(2)], total: 1284, elapsedMs: 210 })

    renderWithProviders(<Search />, { route: '/search?q=央行' })

    await waitFor(() => expect(screen.getByText(/共 1284 条结果，已显示前 2 条/)).toBeInTheDocument())
  })

  it('shows the measured request time, not a constant', async () => {
    searchMock.mockResolvedValue({ results: [card(1)], total: 1, elapsedMs: 1234 })

    renderWithProviders(<Search />, { route: '/search?q=央行' })

    await waitFor(() => expect(screen.getByText(/1\.23 秒/)).toBeInTheDocument())
  })

  it('reports a failed request instead of pretending there are no results', async () => {
    searchMock.mockRejectedValue(new Error('boom'))

    renderWithProviders(<Search />, { route: '/search?q=央行' })

    await waitFor(() => expect(screen.getByText('数据加载失败')).toBeInTheDocument())
    expect(screen.queryByText('0 条结果')).toBeNull()
  })

  it('reports an empty result set as zero results', async () => {
    searchMock.mockResolvedValue({ results: [], total: 0, elapsedMs: 12 })

    renderWithProviders(<Search />, { route: '/search?q=不存在' })

    await waitFor(() => expect(screen.getByText(/0 条结果/)).toBeInTheDocument())
  })
})
