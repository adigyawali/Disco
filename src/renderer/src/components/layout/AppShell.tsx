import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useUI } from '@renderer/stores/ui'
import { LogSessionModal } from '@renderer/components/modals/LogSessionModal'
import { LogQuestionsModal } from '@renderer/components/modals/LogQuestionsModal'
import { LogExamModal } from '@renderer/components/modals/LogExamModal'

export function AppShell(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { quickAdd, closeQuickAdd } = useUI()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="scroll-area flex-1 px-8 py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[1180px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global quick-add modals */}
      <LogSessionModal open={quickAdd === 'session'} onClose={closeQuickAdd} />
      <LogQuestionsModal open={quickAdd === 'questions'} onClose={closeQuickAdd} />
      <LogExamModal open={quickAdd === 'exam'} onClose={closeQuickAdd} />
    </div>
  )
}
