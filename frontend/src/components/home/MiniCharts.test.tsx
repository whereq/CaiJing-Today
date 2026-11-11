import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import MiniCharts from './MiniCharts'

const { chartsMock } = vi.hoisted(() => ({ chartsMock: vi.fn() }))

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../api/client')>('../../api/client')
  return { ...actual, api: { ...actual.api, getCharts: chartsMock } }
})

const chart = (points: number[], direction = 1) => ({
  name_cn: '上证', name_en: 'SSE', value: '3,418.62', change: '+1.24%', direction, points,
})

describe('MiniCharts', () => {
  it('renders no polyline for a single-point series instead of NaN coordinates', async () => {
    chartsMock.mockResolvedValue([chart([12])])

    const { container } = renderWithProviders(<MiniCharts />)

    await waitFor(() => expect(screen.getByText('上证')).toBeInTheDocument())
    // (i * 100) / (n - 1) with n === 1 divides by zero.
    expect(container.querySelector('polyline')).toBeNull()
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('uses the theme tokens so the light theme is honoured', async () => {
    chartsMock.mockResolvedValue([chart([1, 2, 3], 1)])

    const { container } = renderWithProviders(<MiniCharts />)

    await waitFor(() => expect(screen.getByText('上证')).toBeInTheDocument())
    const polyline = container.querySelector('polyline')
    expect(polyline?.getAttribute('stroke')).toBe('var(--up)')
    expect(polyline?.getAttribute('points')).toBe('0.0,1 50.0,2 100.0,3')
  })

  it('reports a failed request instead of an empty panel', async () => {
    chartsMock.mockRejectedValue(new Error('boom'))

    renderWithProviders(<MiniCharts />)

    await waitFor(() => expect(screen.getByText('数据加载失败')).toBeInTheDocument())
  })
})
