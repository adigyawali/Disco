import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  /** Render with this many decimals. */
  decimals?: number
  duration?: number
  suffix?: string
  className?: string
}

/** Animates a number from its previous value to the target with easing. */
export function CountUp({ value, decimals = 0, duration = 900, suffix = '', className }: CountUpProps): JSX.Element {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(from + (value - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return (
    <span className={className}>
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
