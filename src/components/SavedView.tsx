import type { Flower } from '../types/flower'
import { FlowerCard } from './FlowerCard'

interface Props {
  flowers: Flower[]
  isFavorite: (id: string) => boolean
  onToggleFavorite: (flower: Flower) => void
  onClose: () => void
}

export function SavedView({ flowers, isFavorite, onToggleFavorite, onClose }: Props) {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <h2 className="text-forest text-base font-semibold">Saved</h2>
        <button
          onClick={onClose}
          aria-label="Back to discover"
          className="flex items-center gap-1.5 text-eucalyptus text-sm font-medium min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus rounded"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Discover
        </button>
      </div>

      {flowers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <svg className="w-10 h-10 text-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-muted text-sm">No saved flowers yet.<br />Tap the heart on any card to save it.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {flowers.map((flower) => (
            <div key={flower.id} className="h-96 rounded-card overflow-hidden">
              <FlowerCard
                flower={flower}
                isFavorite={isFavorite(flower.id)}
                onToggleFavorite={() => onToggleFavorite(flower)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
