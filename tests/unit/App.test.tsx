import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Flower } from '../../src/types/flower'

vi.mock('../../src/hooks/useFlowers')

const mockFlower: Flower = {
  id: 'golden-wattle',
  common_name: 'Golden Wattle',
  scientific_name: 'Acacia pycnantha',
  region: 'South-eastern Australia',
  bloom_season: 'Spring',
  color: 'Yellow',
  habitat: 'Woodland',
  conservation_status: 'Least Concern',
  short_description: 'A golden beauty of the Australian bush.',
  description: 'Full description of Golden Wattle.',
  image_url: 'https://example.com/wattle.png',
  image_alt: 'Golden Wattle in bloom',
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

async function renderApp() {
  const { default: App } = await import('../../src/App')
  return render(<App />)
}

describe('App transitions', () => {
  it('shows loading state initially', async () => {
    const { useFlowers } = await import('../../src/hooks/useFlowers')
    vi.mocked(useFlowers).mockReturnValue({
      current: null,
      loading: true,
      error: null,
      advance: vi.fn(),
      refetch: vi.fn(),
    })

    const { container } = await renderApp()

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next flower/i })).not.toBeInTheDocument()
  })

  it('shows error state with retry button', async () => {
    const refetch = vi.fn()
    const { useFlowers } = await import('../../src/hooks/useFlowers')
    vi.mocked(useFlowers).mockReturnValue({
      current: null,
      loading: false,
      error: 'API error 500',
      advance: vi.fn(),
      refetch,
    })

    await renderApp()

    expect(screen.getByText(/api error 500/i)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows CardStack when flowers loaded', async () => {
    const { useFlowers } = await import('../../src/hooks/useFlowers')
    vi.mocked(useFlowers).mockReturnValue({
      current: mockFlower,
      loading: false,
      error: null,
      advance: vi.fn(),
      refetch: vi.fn(),
    })

    await renderApp()

    expect(screen.getByRole('heading', { level: 2, name: 'Golden Wattle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next flower/i })).toBeInTheDocument()
  })

  it('shows empty queue message when no flowers remain', async () => {
    const refetch = vi.fn()
    const { useFlowers } = await import('../../src/hooks/useFlowers')
    vi.mocked(useFlowers).mockReturnValue({
      current: null,
      loading: false,
      error: null,
      advance: vi.fn(),
      refetch,
    })

    await renderApp()

    expect(screen.getByText(/no more flowers/i)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('toggles saved view when header heart button is clicked', async () => {
    const { useFlowers } = await import('../../src/hooks/useFlowers')
    vi.mocked(useFlowers).mockReturnValue({
      current: mockFlower,
      loading: false,
      error: null,
      advance: vi.fn(),
      refetch: vi.fn(),
    })

    const user = userEvent.setup()
    await renderApp()

    expect(screen.getByRole('button', { name: /next flower/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /saved flowers/i }))
    expect(screen.getByRole('heading', { name: /saved/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next flower/i })).not.toBeInTheDocument()
  })
})
