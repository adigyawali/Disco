import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Optional footer (e.g. action buttons). */
  footer?: ReactNode
  width?: number
}

/** Glass modal with backdrop blur and spring entrance. */
export function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal
            className="card relative z-10 max-h-[85vh] w-full overflow-hidden p-0"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-content">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"
              >
                <X size={18} />
              </button>
            </header>
            <div className="scroll-area max-h-[60vh] px-6 py-5">{children}</div>
            {footer && (
              <footer className="flex justify-end gap-3 border-t border-border px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
