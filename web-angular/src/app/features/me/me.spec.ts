import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import type { AttendanceLog } from '@shared/api/types';
import { SALARYNET_API } from '../../core/api';
import { provideLocalization } from '../../core/locale.service';
import { CHART_FACTORY } from '../../shared/chart-canvas';
import { fakeCharts, noa, page, payslip } from '../../shared/testing';
import { Me } from './me';

const shift: AttendanceLog = {
  id: 'a1', employeeId: 'e1', employeeName: 'Noa Cohen', checkIn: new Date().toISOString(), checkOut: null, totalHours: 0, isOpen: true,
};

async function setup() {
  localStorage.clear();
  let open: AttendanceLog | null = null;
  const checkIn = vi.fn(async () => (open = shift));
  TestBed.configureTestingModule({
    imports: [Me],
    providers: [
      provideLocalization(),
      provideRouter([]),
      { provide: CHART_FACTORY, useValue: fakeCharts().factory },
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
      {
        provide: SALARYNET_API,
        useValue: {
          employees: { mine: async () => noa },
          payroll: { search: async () => page([payslip]) },
          attendance: { search: async () => page([]), current: async () => open, checkIn },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(Me);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, checkIn };
}

describe('Me', () => {
  it('greets the employee and shows the last net pay', async () => {
    const { el } = await setup();
    expect(el.querySelector('h1')!.textContent).toContain('Noa');
    expect(el.textContent).toContain('₪21,102.60');
  });

  it('checks in and switches the button to check out', async () => {
    const { fixture, el, checkIn } = await setup();
    el.querySelector<HTMLButtonElement>('.shift button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(checkIn).toHaveBeenCalled();
    expect(el.querySelector('.shift button')!.textContent).toContain('Check out');
    expect(el.querySelector('.dot.on')).not.toBeNull();
  });

  it('wraps a long email in the profile', async () => {
    const { el } = await setup();
    expect(el.querySelector('dl.profile dd.ltr')!.textContent).toContain('noa.cohen@salarynet.demo');
  });

  it('opens all payslips', async () => {
    const { el } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('.all-payslips')!.click();
    expect(navigate).toHaveBeenCalledWith(['/payroll']);
  });
});
