import { useState, useCallback, useEffect } from 'react'
import type { Flower } from '../types/flower'

const STORAGE_KEY = 'ozbloom-favorites'

function load(): Flower[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Flower[]) : []
  } catch {
    return []
  }
}

function save(flowers: Flower[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flowers))
  } catch {
    // quota exceeded — silently ignore
  }
}

export interface UseFavoritesResult {
  favorites: Flower[]
  isFavorite: (id: string) => boolean
  toggle: (flower: Flower) => void
}

export function useFavorites(): UseFavoritesResult {
  const [favorites, setFavorites] = useState<Flower[]>(load)

  useEffect(() => {
    save(favorites)
  }, [favorites])

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  )

  const toggle = useCallback((flower: Flower) => {
    setFavorites((prev) =>
      prev.some((f) => f.id === flower.id)
        ? prev.filter((f) => f.id !== flower.id)
        : [...prev, flower],
    )
  }, [])

  return { favorites, isFavorite, toggle }
}
