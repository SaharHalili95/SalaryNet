import { randomChange, type DemoChange } from '@shared/api/demo/demoData';
import { environment } from '../../environments/environment';
import { demoDatabase } from './api';

export const SIMULATION_INTERVAL_MS = 2 * 60_000;

/** Demo mode only: applies a random hire or departure every two minutes and reports it. Returns a stop function. */
export function startDemoSimulation(onChange: (change: DemoChange) => void, enabled = environment.demoMode): () => void {
  if (!enabled) return () => undefined;
  const timer = setInterval(() => onChange(randomChange(demoDatabase())), SIMULATION_INTERVAL_MS);
  return () => clearInterval(timer);
}
