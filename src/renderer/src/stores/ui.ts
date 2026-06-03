import { create } from 'zustand'

export type QuickAddKind = 'session' | 'questions' | 'exam' | null

interface UIState {
  /** Which global quick-add modal is open (null = none). */
  quickAdd: QuickAddKind
  openQuickAdd: (kind: Exclude<QuickAddKind, null>) => void
  closeQuickAdd: () => void
}

export const useUI = create<UIState>((set) => ({
  quickAdd: null,
  openQuickAdd: (kind) => set({ quickAdd: kind }),
  closeQuickAdd: () => set({ quickAdd: null })
}))
