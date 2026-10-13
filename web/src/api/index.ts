import { useAuthStore } from '@/stores/auth'
import type { SalaryNetApi } from './client'
import { createDemoApi } from './demo/demoApi'
import { createDemoDatabase, randomChange, type DemoChange } from './demo/demoData'
import { createHttpApi } from './httpApi'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

let instance: SalaryNetApi | undefined

/** Lazily created so the Pinia store exists before the API asks it for the token. */
export function api(): SalaryNetApi {
  if (!instance) {
    const auth = useAuthStore()
    instance = isDemoMode
      ? createDemoApi(() => auth.token, demoDatabase())
      : createHttpApi(import.meta.env.VITE_API_URL ?? '/api', () => auth.token, () => auth.logout())
  }
  return instance
}

let database: ReturnType<typeof createDemoDatabase> | undefined
const demoDatabase = () => (database ??= createDemoDatabase())

const SIMULATION_INTERVAL_MS = 2 * 60_000

/** Demo mode only: applies a random hire or departure every two minutes and reports it. */
export function startDemoSimulation(onChange: (change: DemoChange) => void): () => void {
  if (!isDemoMode) return () => {}
  const timer = setInterval(() => onChange(randomChange(demoDatabase())), SIMULATION_INTERVAL_MS)
  return () => clearInterval(timer)
}
