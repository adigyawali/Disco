import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'

/** Branded loading screen shown during boot / data load. */
export function Splash(): JSX.Element {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="grid h-20 w-20 place-items-center rounded-3xl bg-accent-gradient shadow-glow"
        >
          <GraduationCap size={40} className="text-white" />
        </motion.div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Disco</h1>
          <p className="text-sm text-content-subtle">Loading…</p>
        </div>
      </motion.div>
    </div>
  )
}
