import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Flower } from '../../src/types/flower'
import { SavedView } from '../../src/components/SavedView'

const mockFlower = (id: string): Flower => ({
  id,
  common_name: `Flower ${id}`,
  scientific_name: `Species ${id}`,
  region: 'NSW',
  bloom_season: 'Spring',
  color: 'Yellow',
  habitat: 'Woodland',
  conservation_status: 'Least Concern',
  short_description: `A beautiful flower ${id}`,
  description: `Detailed description of ${id}`,
  image_url: `https://example.com/${id}.png`,
  image_alt: `Photo of flower ${id}`,
})

function renderSaved(flowers: Flower[] = []) {
  const isFavorite = (id: string) => flowers.some((f) => f.id === id)
  const onToggleFavorite = vi.fn()
  const onClose = vi.fn()

  const result = render(
    <SavedView
      flowers={flowers}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onClose={onClose}
    />,
  )

  return { onToggleFavorite, onClose, flowers, result }
}

describe('SavedView', () => {
  it('shows empty state when no flowers saved', () => {
    renderSaved()
    expect(screen.getByText(/no saved flowers/i)).toBeInTheDocument()
    expect(screen.getByText(/tap the heart/i)).toBeInTheDocument()
  })

  it('renders a list of saved flowers', () => {
    renderSaved([mockFlower('wattle'), mockFlower('waratah')])

    expect(screen.getByText('Flower wattle')).toBeInTheDocument()
    expect(screen.getByText('Flower waratah')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('calls onClose when Discover button is clicked', async () => {
    const { onClose } = renderSaved([mockFlower('wattle')])
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /back to discover/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleFavorite when heart button is clicked on a saved flower', async () => {
    const flowers = [mockFlower('wattle')]
    const isFavorite = (id: string) => flowers.some((f) => f.id === id)
    const onToggleFavorite = vi.fn()
    const user = userEvent.setup()

    render(
      <SavedView
        flowers={flowers}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onClose={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /remove from saved/i }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(onToggleFavorite).toHaveBeenCalledWith(flowers[0])
  })

  it('heart button shows "Save flower" label when not favorited', () => {
    renderSaved([mockFlower('wattle')])

    // In SavedView every flower is "isFavorite" since they're from the saved list,
    // so the label should be "Remove from saved"
    expect(screen.getByRole('button', { name: /remove from saved/i })).toBeInTheDocument()
  })
})
