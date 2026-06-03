import { motion } from 'framer-motion'
import { cn, sectionColor, sectionShort } from '@renderer/lib/utils'
import type { SectionKey } from '@shared/types'
import type { ReactNode } from 'react'

/** Colored section tag chip. */
export function SectionTag({ section }: { section: SectionKey | null }): JSX.Element {
  const color = sectionColor(section)
  return (
    <span
      className="chip"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {sectionShort(section)}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}): JSX.Element {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight text-content"
        >
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1 text-sm text-content-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action
}: {
  icon: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 text-content-subtle opacity-70">{icon}</div>
      <p className="font-medium text-content">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-content-subtle">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Small labeled statistic with optional accent color. */
export function StatTile({
  label,
  children,
  className
}: {
  label: string
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={cn('rounded-xl bg-surface-2/50 p-4', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-content-subtle">{label}</p>
      <div className="mt-1 text-2xl font-bold text-content">{children}</div>
    </div>
  )
}
