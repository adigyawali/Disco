import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, GraduationCap } from 'lucide-react'
import { NAV_ITEMS } from '@renderer/lib/nav'
import { cn } from '@renderer/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="relative z-20 flex h-full flex-col border-r border-border bg-bg-elevated/70 backdrop-blur-xl"
    >
      {/* Brand — sits below the macOS traffic lights, draggable. */}
      <div className="drag-region flex items-center gap-3 px-5 pb-4 pt-12">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-gradient shadow-glow">
          <GraduationCap size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="text-lg font-bold tracking-tight"
            >
              Disco
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="scroll-area flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {({ isActive }) => (
              <div
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-content-muted hover:text-content'
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-accent-gradient shadow-glow"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon size={19} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="no-drag m-3 flex items-center justify-center gap-2 rounded-xl bg-surface-2/60 py-2.5 text-content-subtle transition-colors hover:text-content"
      >
        <motion.span animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft size={18} />
        </motion.span>
        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
      </button>
    </motion.aside>
  )
}
