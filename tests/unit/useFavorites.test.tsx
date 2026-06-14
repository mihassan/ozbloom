import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Flower } from '../../src/types/flower'
import { useFavorites } from '../../src/hooks/useFavorites'

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

beforeEach(() => {
  localStorage.clear()
})

describe('useFavorites', () => {
  it('starts with an empty list', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toHaveLength(0)
    expect(result.current.isFavorite('any')).toBe(false)
  })

  it('toggle adds a flower to favorites', () => {
    const { result } = renderHook(() => useFavorites())
    const flower = mockFlower('wattle')

    act(() => result.current.toggle(flower))

    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].id).toBe('wattle')
    expect(result.current.isFavorite('wattle')).toBe(true)
  })

  it('toggle removes a flower that was already favorited', () => {
    const { result } = renderHook(() => useFavorites())
    const flower = mockFlower('wattle')

    act(() => result.current.toggle(flower))
    expect(result.current.isFavorite('wattle')).toBe(true)

    act(() => result.current.toggle(flower))
    expect(result.current.favorites).toHaveLength(0)
    expect(result.current.isFavorite('wattle')).toBe(false)
  })

  it('maintains multiple favorites', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => result.current.toggle(mockFlower('a')))
    act(() => result.current.toggle(mockFlower('b')))
    act(() => result.current.toggle(mockFlower('c')))

    expect(result.current.favorites).toHaveLength(3)
    expect(result.current.isFavorite('a')).toBe(true)
    expect(result.current.isFavorite('b')).toBe(true)
    expect(result.current.isFavorite('c')).toBe(true)
    expect(result.current.isFavorite('d')).toBe(false)
  })

  it('persists favorites to localStorage', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => result.current.toggle(mockFlower('wattle')))
    act(() => result.current.toggle(mockFlower('waratah')))

    // Check localStorage was written
    const raw = localStorage.getItem('ozbloom-favorites')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].id).toBe('wattle')
    expect(parsed[1].id).toBe('waratah')
  })

  it('loads persisted favorites from localStorage on mount', () => {
    const flower = mockFlower('persisted')
    localStorage.setItem('ozbloom-favorites', JSON.stringify([flower]))

    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].id).toBe('persisted')
    expect(result.current.isFavorite('persisted')).toBe(true)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('ozbloom-favorites', 'invalid-json{{{')

    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toHaveLength(0)
  })
})
