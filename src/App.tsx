import { useFlowers } from './hooks/useFlowers'
import { CardStack } from './components/CardStack'

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
  const { current, loading, error, advance } = useFlowers()

  return (
    <div className="min-h-[100dvh] bg-cream flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col px-4 py-6" style={{ height: '100dvh' }}>
        <header className="flex-shrink-0 mb-4">
          <h2 className="text-eucalyptus text-sm font-semibold tracking-widest uppercase">
            OzBloom
          </h2>
        </header>

        <main className="flex-1 min-h-0">
          {loading && <LoadingState />}
          {!loading && error && (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          )}
          {!loading && !error && current && (
            <CardStack flower={current} onAdvance={advance} />
          )}
        </main>
      </div>
    </div>
  )
}
