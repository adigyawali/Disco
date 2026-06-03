import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@renderer/lib/utils'
import type { ReactNode } from 'react'

interface CardProps extends HTMLMotionProps<'div'> {
  /** Adds a hover lift + glow. */
  interactive?: boolean
  className?: string
  children: ReactNode
}

/** The frosted-glass surface used everywhere. Animates in on mount. */
export function Card({ interactive, className, children, ...rest }: CardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={interactive ? { y: -4 } : undefined}
      className={cn('card p-5', interactive && 'cursor-pointer transition-shadow hover:shadow-card-hover', className)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function CardTitle({
  children,
  right
}: {
  children: ReactNode
  right?: ReactNode
}): JSX.Element {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide text-content-muted uppercase">{children}</h3>
      {right}
    </div>
  )
}
