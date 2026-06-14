import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Flower } from '../../src/types/flower'
import { useFlowers } from '../../src/hooks/useFlowers'

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

const makeBatch = (ids: string[]): { flowers: Flower[] } => ({
  flowers: ids.map(mockFlower),
})

const BATCH_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useFlowers', () => {
  it('loads initial batch and returns first flower', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeBatch(BATCH_IDS),
    }))

    const { result } = renderHook(() => useFlowers())

    expect(result.current.loading).toBe(true)
    expect(result.current.current).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.current?.id).toBe('a')
    expect(result.current.error).toBeNull()
  })

  it('advance moves to next flower in queue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeBatch(BATCH_IDS),
    }))

    const { result } = renderHook(() => useFlowers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.current?.id).toBe('a')

    act(() => result.current.advance())
    await waitFor(() => expect(result.current.current?.id).toBe('b'))
  })

  it('sets error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    const { result } = renderHook(() => useFlowers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toMatch(/500/)
    expect(result.current.current).toBeNull()
  })

  it('prefetches next batch when 2 cards remain', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeBatch(BATCH_IDS) })
      .mockResolvedValue({ ok: true, json: async () => makeBatch(['x', 'y', 'z']) })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useFlowers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // advance to index 6 (2 remaining: g, h)
    for (let i = 0; i < 6; i++) {
      act(() => result.current.advance())
    }

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('dedup: second batch has shared flower filtered out', async () => {
    const sharedFlower = mockFlower('shared')
    const secondBatch = [sharedFlower, mockFlower('new1'), mockFlower('new2')]

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeBatch(BATCH_IDS) })
      .mockResolvedValue({ ok: true, json: async () => ({ flowers: secondBatch }) })

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useFlowers())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // advance to index 6 — 2 cards remain (g, h), triggering prefetch
    for (let i = 0; i < 6; i++) {
      act(() => result.current.advance())
      await waitFor(() => expect(result.current.current?.id).toBeDefined())
    }

    // wait for prefetch to complete
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 3000 })

    // advance past the first batch entirely
    for (let i = 0; i < 4; i++) {
      act(() => result.current.advance())
      await waitFor(() => expect(result.current.current?.id).toBeDefined())
    }

    // the next cards should be new1 and new2 (shared was filtered), not 'shared'
    expect(result.current.current?.id).not.toBe('shared')
  })
})
