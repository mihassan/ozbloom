import { useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'
import type { Flower } from '../types/flower'
import { FlowerCard } from './FlowerCard'

interface Props {
  flower: Flower
  onAdvance: () => void
}

const SWIPE_THRESHOLD = 80
const EXIT_X = 500

export function CardStack({ flower, onAdvance }: Props) {
  const [exiting, setExiting] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], prefersReducedMotion ? [0, 0] : [-18, 18])
  const opacity = useTransform(x, [-EXIT_X / 2, 0, EXIT_X / 2], [0, 1, 0])

  const dismiss = useCallback(
    async (direction: 1 | -1) => {
      if (exiting) return
      setExiting(true)
      if (prefersReducedMotion) {
        x.set(0)
        setExiting(false)
        onAdvance()
      } else {
        await animate(x, direction * EXIT_X, { duration: 0.3, ease: 'easeOut' })
        x.set(0)
        setExiting(false)
        onAdvance()
      }
    },
    [exiting, x, onAdvance, prefersReducedMotion],
  )

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        dismiss(info.offset.x > 0 ? 1 : -1)
      } else {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      }
    },
    [dismiss, x],
  )

  return (
    <div className="flex flex-col items-center gap-5 w-full h-full">
      <div className="relative w-full flex-1 touch-action-none" style={{ minHeight: 0 }}>
        <motion.div
          key={flower.id}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={prefersReducedMotion ? 0 : 0.15}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
        >
          <FlowerCard flower={flower} />
        </motion.div>
      </div>

      <button
        onClick={() => dismiss(1)}
        disabled={exiting}
        className="flex items-center gap-2 px-8 py-3 rounded-lg bg-eucalyptus text-cream font-medium text-sm
                   min-h-[44px] min-w-[44px] shadow-card
                   hover:bg-forest transition-colors duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus focus-visible:ring-offset-2"
        aria-label="Next flower"
      >
        <span>Next</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
