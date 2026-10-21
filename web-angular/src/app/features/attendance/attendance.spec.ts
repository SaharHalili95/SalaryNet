import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import type { AttendanceLog } from '@shared/api/types';
import { SALARYNET_API } from '../../core/api';
import { SESSION_KEY } from '../../core/auth.service';
import { providePaginatorIntl } from '../../core/paginator-intl';
import { Attendance } from './attendance';

const openShift: AttendanceLog = { id: 'a1', employeeId: 'e1', employeeName: 'Noa Cohen', checkIn: new Date(Date.now() - 3_600_000).toISOString(), checkOut: null, totalHours: 0, isOpen: true };

async function setup(role: 'Admin' | 'HR' | 'Employee') {
  localStorage.clear();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'token', expiresAt: '2099-01-01T00:00:00.000Z', user: {
    id: 'u1', email: 'demo@salarynet.demo', displayName: 'Demo', role, employeeId: role === 'Employee' ? 'e1' : null,
  } }));
  let current: AttendanceLog | null = null;
  const checkIn = vi.fn(async () => (current = openShift));
  TestBed.configureTestingModule({
    imports: [Attendance],
    providers: [
      providePaginatorIntl(), provideRouter([]), { provide: MatSnackBar, useValue: { open: vi.fn() } },
      { provide: SALARYNET_API, useValue: { attendance: { current: async () => current, checkIn, checkOut: async () => null, search: async () => ({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }) } } },
    ],
  });
  const fixture = TestBed.createComponent(Attendance);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, checkIn };
}

describe('Attendance', () => {
  it('clocks in and updates the employee clock state', async () => {
    const { fixture, el, checkIn } = await setup('Employee');
    el.querySelector<HTMLButtonElement>('.clock button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(checkIn).toHaveBeenCalledOnce();
    expect(el.querySelector('.dot.on')).not.toBeNull();
    expect(el.querySelector('.clock button')!.textContent).toContain('Check out');
  });

  it('does not show the employee clock to staff', async () => {
    const { el } = await setup('HR');
    expect(el.querySelector('.clock')).toBeNull();
  });
});
