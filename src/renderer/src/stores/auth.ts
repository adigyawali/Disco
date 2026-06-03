import { create } from 'zustand'
import { api } from '@renderer/lib/utils'
import type { SignupInput, User } from '@shared/types'

type Phase = 'loading' | 'signup' | 'login' | 'authed'

interface AuthState {
  phase: Phase
  user: User | null
  error: string | null
  /** Determine initial phase: signup (no account), login, or resume session. */
  init: () => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  login: (password: string, remember: boolean) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  phase: 'loading',
  user: null,
  error: null,

  init: async () => {
    const state = await api.auth.state()
    if (!state.hasAccount) {
      set({ phase: 'signup' })
      return
    }
    const resumed = await api.auth.resume()
    if (resumed) set({ phase: 'authed', user: resumed })
    else set({ phase: 'login' })
  },

  signup: async (input) => {
    const user = await api.auth.signup(input)
    set({ phase: 'authed', user, error: null })
  },

  login: async (password, remember) => {
    const user = await api.auth.login(password, remember)
    if (!user) {
      set({ error: 'Incorrect password. Try again.' })
      return false
    }
    set({ phase: 'authed', user, error: null })
    return true
  },

  logout: async () => {
    await api.auth.logout()
    set({ phase: 'login', user: null })
  }
}))
