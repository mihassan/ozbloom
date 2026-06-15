import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Flower } from '../../src/types/flower'
import { CardStack } from '../../src/components/CardStack'

vi.mock('framer-motion', () => ({
  motion: { div: 'div' },
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    onChange: vi.fn(),
    stop: vi.fn(),
    isAnimating: vi.fn(),
    destroy: vi.fn(),
  }),
  useTransform: () => ({
    get: () => 0,
    onChange: vi.fn(),
    getVelocity: () => 0,
  }),
  useReducedMotion: () => false,
  animate: vi.fn().mockResolvedValue(undefined),
}))

const flower: Flower = {
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
})

describe('CardStack', () => {
  it('renders the flower card with common name', () => {
    render(
      <CardStack flower={flower} onAdvance={vi.fn()} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Golden Wattle' })).toBeInTheDocument()
  })

  it('renders the Next flower button', () => {
    render(
      <CardStack flower={flower} onAdvance={vi.fn()} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /next flower/i })).toBeInTheDocument()
  })

  it('calls onAdvance when Next button is clicked', async () => {
    const onAdvance = vi.fn()
    const user = userEvent.setup()

    render(
      <CardStack flower={flower} onAdvance={onAdvance} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: /next flower/i }))
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('renders share and favorite buttons inside the card', () => {
    render(
      <CardStack flower={flower} onAdvance={vi.fn()} isFavorite={true} onToggleFavorite={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /remove from saved/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share flower/i })).toBeInTheDocument()
  })
})
