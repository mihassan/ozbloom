import { useState } from 'react'
import type { Flower } from '../types/flower'

interface Props {
  flower: Flower
  isFavorite: boolean
  onToggleFavorite: () => void
}

const BADGE_COLORS: Record<string, string> = {
  'Least Concern': 'bg-eucalyptus/10 text-eucalyptus',
  'Vulnerable': 'bg-wattle/20 text-forest',
  'Endangered': 'bg-red-100 text-red-700',
  'Unknown': 'bg-sand text-muted',
}

function ConservationBadge({ status }: { status: string }) {
  const cls = BADGE_COLORS[status] ?? 'bg-sand text-muted'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function ImageFallback({ alt }: { alt: string }) {
  return (
    <div className="w-full h-full bg-sand flex flex-col items-center justify-center gap-2">
      <svg className="w-12 h-12 text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.5c1.5-2 4-3 6-1.5M6 10c-2-1-3.5.5-3 2.5M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
      </svg>
      <p className="text-xs text-muted px-4 text-center">{alt}</p>
    </div>
  )
}

function IconButton({ onClick, ariaLabel, children }: { onClick: () => void; ariaLabel: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center w-11 h-11 rounded-full bg-cream/80 backdrop-blur-sm text-forest hover:bg-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus"
    >
      {children}
    </button>
  )
}

async function shareFlower(flower: Flower) {
  const text = `${flower.common_name} (${flower.scientific_name}) — ${flower.short_description}`
  const url = 'https://ozbloom.mihassan.workers.dev'
  if (navigator.share) {
    await navigator.share({ title: flower.common_name, text, url })
  } else {
    await navigator.clipboard.writeText(`${text}\n${url}`)
  }
}

export function FlowerCard({ flower, isFavorite, onToggleFavorite }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    await shareFlower(flower)
    if (!navigator.share) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-sand rounded-card shadow-card-lg overflow-hidden">
      <div className="relative flex-shrink-0" style={{ height: '62%' }}>
        <img
          src={flower.image_url}
          alt={flower.image_alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.removeAttribute('hidden')
          }}
        />
        <div hidden className="absolute inset-0">
          <ImageFallback alt={flower.image_alt} />
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <IconButton onClick={onToggleFavorite} ariaLabel={isFavorite ? 'Remove from saved' : 'Save flower'}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </IconButton>
          <IconButton onClick={handleShare} ariaLabel={copied ? 'Copied!' : 'Share flower'}>
            {copied ? (
              <svg className="w-5 h-5 text-eucalyptus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-5 pt-4 pb-6 gap-3">
        <div>
          <h1 className="text-forest text-2xl font-semibold leading-tight tracking-tight">
            {flower.common_name}
          </h1>
          <p className="text-muted text-sm italic mt-0.5">{flower.scientific_name}</p>
        </div>

        <p className="text-forest/80 text-sm leading-relaxed">{flower.short_description}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted text-xs uppercase tracking-wide">Region</dt>
            <dd className="text-forest font-medium">{flower.region}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wide">Blooms</dt>
            <dd className="text-forest font-medium">{flower.bloom_season}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wide">Colour</dt>
            <dd className="text-forest font-medium">{flower.color}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs uppercase tracking-wide">Habitat</dt>
            <dd className="text-forest font-medium">{flower.habitat}</dd>
          </div>
        </dl>

        <ConservationBadge status={flower.conservation_status} />
      </div>
    </div>
  )
}
