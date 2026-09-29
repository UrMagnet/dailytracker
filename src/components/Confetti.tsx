import { motion } from 'framer-motion'

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']
const DOTS = Array.from({ length: 14 }, (_, i) => i)

/**
 * Small self-contained celebration burst (debt payoff, streak milestones) —
 * intentionally not an external confetti dependency, just a few animated dots.
 */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {DOTS.map((i) => {
        const angle = (i / DOTS.length) * Math.PI * 2
        const distance = 40 + (i % 3) * 18
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
