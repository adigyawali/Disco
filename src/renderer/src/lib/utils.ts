import { SECTION_BY_KEY, type SectionKey } from '@shared/types'

/** Minimal classNames joiner (truthy strings only). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Typed handle to the preload bridge. */
export const api = window.api

export function sectionColor(key: SectionKey | null | undefined): string {
  return key ? SECTION_BY_KEY[key].color : 'rgb(var(--content-subtle))'
}

export function sectionShort(key: SectionKey | null | undefined): string {
  return key ? SECTION_BY_KEY[key].short : '—'
}

/** "2h 30m" style duration from minutes. */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Clamp a number into [min, max]. */
export const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n))
