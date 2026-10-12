import { useAuthStore } from '@/stores/auth'
import type { SalaryNetApi } from './client'
import { createDemoApi } from './demo/demoApi'
import { createHttpApi } from './httpApi'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

let instance: SalaryNetApi | undefined

/** Lazily created so the Pinia store exists before the API asks it for the token. */
export function api(): SalaryNetApi {
  if (!instance) {
    const auth = useAuthStore()
    instance = isDemoMode
      ? createDemoApi(() => auth.token)
      : createHttpApi(import.meta.env.VITE_API_URL ?? '/api', () => auth.token, () => auth.logout())
  }
  return instance
}
