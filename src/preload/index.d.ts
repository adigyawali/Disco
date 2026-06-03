import type { DiscoApi } from '../shared/types'

declare global {
  interface Window {
    api: DiscoApi
  }
}

export {}
