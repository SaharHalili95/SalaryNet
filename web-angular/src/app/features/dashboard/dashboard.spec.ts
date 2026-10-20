import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SALARYNET_API } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { provideLocalization } from '../../core/locale.service';
import { CHART_FACTORY } from '../../shared/chart-canvas';
import { fakeCharts, summary } from '../../shared/testing';
import { Dashboard } from './dashboard';

async function setup() {
  localStorage.clear();
  const charts = fakeCharts();
  TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      provideLocalization(),
      provideRouter([]),
      { provide: CHART_FACTORY, useValue: charts.factory },
      { provide: SALARYNET_API, useValue: { dashboard: async () => summary } },
      { provide: AuthService, useValue: { isAdmin: () => false } },
    ],
  });
  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, charts };
}

describe('Dashboard', () => {
  it('shows four tiles from the summary', async () => {
    const { el } = await setup();
    expect(el.querySelectorAll('app-stat-tile')).toHaveLength(4);
    expect(el.textContent).toContain('38');
  });

  it('draws the trend and department charts', async () => {
    const { charts } = await setup();
    expect(charts.created).toHaveLength(2);
  });

  it('switches a chart to a scrollable table', async () => {
    const { fixture, el } = await setup();
    el.querySelector<HTMLButtonElement>('.panel-head button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.table-scroll .data-table')).not.toBeNull();
    expect(el.querySelector('.data-table')!.textContent).toContain('₪720,000.00');
  });

  it('shows the workforce mix by contract type', async () => {
    const { el } = await setup();
    const meters = el.querySelectorAll('.meters li');
    expect(meters).toHaveLength(1);
    expect(meters[0]!.textContent).toContain('Full-time');
    expect(meters[0]!.querySelector<HTMLElement>('.meter div')!.style.width).toBe('100%');
  });
});
