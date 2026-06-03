import { create } from 'zustand'
import { api } from '@renderer/lib/utils'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  /** Apply a theme to <html> and persist it to settings. */
  set: (theme: Theme) => void
  toggle: () => void
  /** Sync from persisted settings on boot (no write-back). */
  hydrate: (theme: Theme) => void
}

function apply(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: 'dark',
  set: (theme) => {
    apply(theme)
    set({ theme })
    void api.settings.update({ theme })
  },
  toggle: () => get().set(get().theme === 'dark' ? 'light' : 'dark'),
  hydrate: (theme) => {
    apply(theme)
    set({ theme })
  }
}))
