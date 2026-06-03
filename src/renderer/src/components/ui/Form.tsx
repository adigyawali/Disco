import { motion } from 'framer-motion'
import { cn } from '@renderer/lib/utils'
import { SECTIONS, type SectionKey } from '@shared/types'
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Field({
  label,
  children,
  hint
}: {
  label: string
  children: ReactNode
  hint?: string
}): JSX.Element {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-content-subtle">{hint}</p>}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input {...props} className={cn('input', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return <textarea {...props} className={cn('input min-h-[90px] resize-y', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return <select {...props} className={cn('input cursor-pointer appearance-none', props.className)} />
}

/** Animated 1-5 rating dots (focus / energy / feeling). */
export function RatingPicker({
  value,
  onChange,
  max = 5
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}): JSX.Element {
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <motion.button
          key={n}
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(n)}
          className={cn(
            'h-9 w-9 rounded-lg text-sm font-semibold transition-all',
            n <= value
              ? 'bg-accent-gradient text-white shadow-glow'
              : 'bg-surface-2 text-content-subtle hover:text-content'
          )}
        >
          {n}
        </motion.button>
      ))}
    </div>
  )
}

/** Pill selector for the four MCAT sections (plus optional clear). */
export function SectionPicker({
  value,
  onChange,
  allowNull = true
}: {
  value: SectionKey | null
  onChange: (v: SectionKey | null) => void
  allowNull?: boolean
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {allowNull && (
        <PillButton active={value === null} onClick={() => onChange(null)} color="rgb(var(--content-subtle))">
          Any
        </PillButton>
      )}
      {SECTIONS.map((s) => (
        <PillButton
          key={s.key}
          active={value === s.key}
          onClick={() => onChange(s.key)}
          color={s.color}
        >
          {s.short}
        </PillButton>
      ))}
    </div>
  )
}

function PillButton({
  active,
  onClick,
  color,
  children
}: {
  active: boolean
  onClick: () => void
  color: string
  children: ReactNode
}): JSX.Element {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
        active ? 'text-white' : 'border-border bg-surface-2/60 text-content-muted hover:text-content'
      )}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      {children}
    </motion.button>
  )
}

/** Animated toggle switch. */
export function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 rounded-full transition-colors duration-300',
        checked ? 'bg-accent' : 'bg-surface-2'
      )}
    >
      <motion.span
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
        animate={{ left: checked ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}
