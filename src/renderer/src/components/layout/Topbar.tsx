import { motion } from 'framer-motion'
import { CalendarClock, Flame, Moon, Plus, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@renderer/stores/theme'
import { useUI } from '@renderer/stores/ui'
import { useApp } from '@renderer/stores/app'

export function Topbar(): JSX.Element {
  const { theme, toggle } = useTheme()
  const openQuickAdd = useUI((s) => s.openQuickAdd)
  const dashboard = useApp((s) => s.dashboard)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="drag-region flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border px-6">
      {/* Live status chips */}
      {dashboard && (
        <div className="no-drag mr-auto flex items-center gap-2">
          {dashboard.streak > 0 && (
            <span className="chip bg-warning/15 text-warning">
              <Flame size={14} /> {dashboard.streak} day streak
            </span>
          )}
          {dashboard.daysUntilTest != null && (
            <span className="chip bg-accent/15 text-accent">
              <CalendarClock size={14} /> {dashboard.daysUntilTest} days to test
            </span>
          )}
        </div>
      )}

      <div className="no-drag relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="btn-primary"
        >
          <Plus size={16} /> Quick Add
        </button>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="card absolute right-0 top-12 z-30 w-52 p-1.5"
          >
            {(
              [
                ['session', 'Study Session'],
                ['questions', 'Practice Questions'],
                ['exam', 'Full-Length Score']
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                onMouseDown={() => openQuickAdd(kind)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
              >
                <Plus size={15} /> {label}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <button
        onClick={toggle}
        className="no-drag grid h-10 w-10 place-items-center rounded-xl bg-surface-2/60 text-content-muted transition-colors hover:text-content"
        title="Toggle theme"
      >
        <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.span>
      </button>
    </header>
  )
}
