import { useState } from 'react'
import { useFlowers } from './hooks/useFlowers'
import { useFavorites } from './hooks/useFavorites'
import { CardStack } from './components/CardStack'
import { SavedView } from './components/SavedView'

function LoadingState() {
  return (
    <div className="w-full h-full bg-sand rounded-card shadow-card-lg animate-pulse" />
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full h-full bg-sand rounded-card shadow-card flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-lg bg-eucalyptus text-cream text-sm font-medium min-h-[44px] hover:bg-forest transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

export default function App() {
  const { current, loading, error, advance, refetch } = useFlowers()
  const { favorites, isFavorite, toggle } = useFavorites()
  const [showSaved, setShowSaved] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-cream flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col px-4 py-6" style={{ height: '100dvh' }}>
        <header className="flex-shrink-0 mb-4 flex items-center justify-between">
          <h2 className="text-eucalyptus text-sm font-semibold tracking-widest uppercase">
            OzBloom
          </h2>
          <button
            onClick={() => setShowSaved((v) => !v)}
            aria-label={showSaved ? 'Back to discover' : `Saved flowers (${favorites.length})`}
            className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-sand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
          >
            <svg className="w-5 h-5 text-forest" fill={showSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {favorites.length > 0 && !showSaved && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-wattle" aria-hidden="true" />
            )}
          </button>
        </header>

        <main className="flex-1 min-h-0">
          {showSaved ? (
            <SavedView
              flowers={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={toggle}
              onClose={() => setShowSaved(false)}
            />
          ) : (
            <>
              {loading && <LoadingState />}
              {!loading && error && (
                <ErrorState message={error} onRetry={refetch} />
              )}
              {!loading && !error && current && (
                <CardStack
                  flower={current}
                  onAdvance={advance}
                  isFavorite={isFavorite(current.id)}
                  onToggleFavorite={() => toggle(current)}
                />
              )}
              {!loading && !error && !current && (
                <ErrorState message="No more flowers to show" onRetry={refetch} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
