import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Flower } from '../../src/types/flower'
import { FlowerCard } from '../../src/components/FlowerCard'

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

describe('FlowerCard', () => {
  it('renders common name, scientific name, and description', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Golden Wattle' })).toBeInTheDocument()
    expect(screen.getByText('Acacia pycnantha')).toBeInTheDocument()
    expect(screen.getByText('A golden beauty of the Australian bush.')).toBeInTheDocument()
  })

  it('renders all metadata fields', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    expect(screen.getByText('South-eastern Australia')).toBeInTheDocument()
    expect(screen.getByText('Spring')).toBeInTheDocument()
    expect(screen.getByText('Yellow')).toBeInTheDocument()
    expect(screen.getByText('Woodland')).toBeInTheDocument()
  })

  it('renders conservation badge', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    const badge = screen.getByText('Least Concern')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('rounded-full')
  })

  it('renders the flower image with alt text', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/wattle.png')
    expect(img).toHaveAttribute('alt', 'Golden Wattle in bloom')
  })

  it('shows filled heart when isFavorite is true', () => {
    render(
      <FlowerCard flower={flower} isFavorite={true} onToggleFavorite={vi.fn()} />,
    )

    const btn = screen.getByRole('button', { name: /remove from saved/i })
    const svg = btn.querySelector('svg')
    expect(svg).toHaveAttribute('fill', 'currentColor')
  })

  it('shows outlined heart when isFavorite is false', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    const btn = screen.getByRole('button', { name: /save flower/i })
    const svg = btn.querySelector('svg')
    expect(svg).toHaveAttribute('fill', 'none')
  })

  it('calls onToggleFavorite when heart button clicked', async () => {
    const onToggleFavorite = vi.fn()
    const user = userEvent.setup()

    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={onToggleFavorite} />,
    )

    await user.click(screen.getByRole('button', { name: /save flower/i }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('renders share button', () => {
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /share flower/i })).toBeInTheDocument()
  })

  it('share button is present and clickable', async () => {
    const user = userEvent.setup()
    render(
      <FlowerCard flower={flower} isFavorite={false} onToggleFavorite={vi.fn()} />,
    )

    const shareBtn = screen.getByRole('button', { name: /share flower/i })
    expect(shareBtn).toBeInTheDocument()

    // Clicking share should not throw (handles both Web Share and clipboard paths)
    await expect(user.click(shareBtn)).resolves.toBeUndefined()
  })
})
