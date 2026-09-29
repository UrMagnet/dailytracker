import { useEffect, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 ${className}`}
    >
      <motion.div
        className="h-full rounded-full bg-[image:var(--gradient-accent)]"
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      />
    </div>
  )
}

export function ProgressRing({
  percent,
  size = 96,
  stroke = 8,
  children,
}: {
  percent: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          className="stroke-indigo-600 dark:stroke-indigo-400"
          initial={false}
          animate={{ strokeDashoffset: c - (clamped / 100) * c }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  sublabel,
  className = '',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  sublabel?: ReactNode
  className?: string
}) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800/60 ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <motion.span
        aria-hidden
        animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors
          ${
            checked
              ? 'border-indigo-600 bg-[image:var(--gradient-accent)] text-white dark:border-indigo-400'
              : 'border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-950'
          }`}
      >
        {checked && (
          <motion.svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <motion.path
              d="M4 10.5l4 4 8-9"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.svg>
        )}
      </motion.span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm leading-snug transition ${
            checked
              ? 'text-neutral-400 line-through dark:text-neutral-500'
              : 'text-neutral-800 dark:text-neutral-100'
          }`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{sublabel}</span>
        )}
      </span>
    </label>
  )
}

/** Animates numeric changes with a spring instead of jumping straight to the new value. */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString('id-ID'),
  className = '',
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20, mass: 0.8 })
  const display = useTransform(spring, (v) => format(v))

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}

/** Minimal inline sparkline — no charting library needed for a small trend line. */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  className = '',
}: {
  values: number[]
  width?: number
  height?: number
  className?: string
}) {
  if (values.length < 2) {
    return <div style={{ width, height }} className={className} />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
  const trendUp = values[values.length - 1] >= values[0]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <polyline
        points={points}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={trendUp ? 'stroke-emerald-500' : 'stroke-rose-500'}
      />
    </svg>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</div>}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
      {children}
    </p>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4L19 9l-4-4L4 16v4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
