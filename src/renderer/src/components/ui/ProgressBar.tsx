import { motion } from 'framer-motion'
import { cn } from '@renderer/lib/utils'

interface ProgressBarProps {
  /** 0-100 */
  value: number
  className?: string
  /** Override the fill color (defaults to the accent gradient). */
  color?: string
  height?: number
}

/** Animated horizontal progress fill. */
export function ProgressBar({ value, className, color, height = 8 }: ProgressBarProps): JSX.Element {
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-2', className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: color ?? 'linear-gradient(90deg, rgb(var(--accent)), rgb(var(--violet)))'
        }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
