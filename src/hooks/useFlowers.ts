import { useState, useEffect, useRef, useCallback } from 'react'
import type { Flower } from '../types/flower'

const BATCH_SIZE = 8
const PREFETCH_THRESHOLD = 2
const DEDUP_WINDOW = 16

async function fetchBatch(): Promise<Flower[]> {
  const res = await fetch(`/api/flowers/random?limit=${BATCH_SIZE}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = (await res.json()) as { flowers: Flower[] }
  return data.flowers
}

export interface UseFlowersResult {
  current: Flower | null
  loading: boolean
  error: string | null
  advance: () => void
}

export function useFlowers(): UseFlowersResult {
  const [queue, setQueue] = useState<Flower[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seenWindow = useRef<string[]>([])
  const prefetching = useRef(false)

  const dedupe = useCallback((incoming: Flower[], lastId: string | null): Flower[] => {
    const window = seenWindow.current
    return incoming.filter((f) => {
      if (f.id === lastId) return false
      if (window.includes(f.id)) return false
      return true
    })
  }, [])

  const trackSeen = useCallback((id: string) => {
    seenWindow.current = [...seenWindow.current, id].slice(-DEDUP_WINDOW)
  }, [])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const batch = await fetchBatch()
      setQueue(batch)
      setIndex(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load flowers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const prefetchIfNeeded = useCallback(async (currentQueue: Flower[], currentIndex: number) => {
    const remaining = currentQueue.length - currentIndex
    if (remaining > PREFETCH_THRESHOLD || prefetching.current) return

    prefetching.current = true
    try {
      const batch = await fetchBatch()
      const lastId = currentQueue[currentQueue.length - 1]?.id ?? null
      const filtered = dedupe(batch, lastId)
      const toAppend = filtered.length > 0 ? filtered : batch
      setQueue((prev) => [...prev, ...toAppend])
    } catch {
      // silent — user still has remaining cards
    } finally {
      prefetching.current = false
    }
  }, [dedupe])

  const advance = useCallback(() => {
    setQueue((currentQueue) => {
      setIndex((currentIndex) => {
        const nextIndex = currentIndex + 1
        if (currentQueue[currentIndex]) {
          trackSeen(currentQueue[currentIndex].id)
        }
        prefetchIfNeeded(currentQueue, nextIndex)
        return nextIndex
      })
      return currentQueue
    })
  }, [trackSeen, prefetchIfNeeded])

  const current = queue[index] ?? null

  return { current, loading, error, advance }
}
