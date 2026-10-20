import { startDemoSimulation, SIMULATION_INTERVAL_MS } from './demo-simulation';

describe('startDemoSimulation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reports a hire or departure every two minutes until stopped', () => {
    const changes: string[] = [];
    const stop = startDemoSimulation((change) => changes.push(change.kind), true);
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS * 2);
    expect(changes).toHaveLength(2);
    expect(['hire', 'leave']).toContain(changes[0]);
    stop();
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS * 2);
    expect(changes).toHaveLength(2);
  });

  it('does nothing outside demo mode', () => {
    const changes: string[] = [];
    startDemoSimulation((change) => changes.push(change.kind), false);
    vi.advanceTimersByTime(SIMULATION_INTERVAL_MS * 3);
    expect(changes).toHaveLength(0);
  });
});
