import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import type { PayrollRecord } from '@shared/api/types';
import { of } from 'rxjs';
import { SALARYNET_API } from '../../core/api';
import { SESSION_KEY } from '../../core/auth.service';
import { provideLocalization } from '../../core/locale.service';
import { page, payslip } from '../../shared/testing';
import { Payroll } from './payroll';

async function setup(role: 'Admin' | 'HR' | 'Employee', records: PayrollRecord[] = [payslip]) {
  localStorage.clear();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'token', expiresAt: '2099-01-01T00:00:00.000Z', user: {
    id: 'u1', email: 'demo@salarynet.demo', displayName: 'Demo', role, employeeId: role === 'Employee' ? 'e1' : null,
  } }));
  const search = vi.fn(async () => page(records));
  const open = vi.fn((...args: unknown[]) => {
    void args;
    return { afterClosed: () => of(undefined) };
  });
  TestBed.configureTestingModule({
    imports: [Payroll],
    providers: [
      provideLocalization(),
      provideRouter([]),
      { provide: MatDialog, useValue: { open } },
      { provide: SALARYNET_API, useValue: { payroll: { search }, departments: { list: async () => [] } } },
    ],
  });
  const fixture = TestBed.createComponent(Payroll);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, search, open };
}

describe('Payroll', () => {
  it('hides staff actions and department filter for employees', async () => {
    const { el } = await setup('Employee');
    expect(el.querySelector('.header-actions')).toBeNull();
    expect(el.querySelector('[data-filter="department"]')).toBeNull();
  });

  it('opens a payslip when a payroll row is selected', async () => {
    const { el, open } = await setup('HR');
    el.querySelector<HTMLTableRowElement>('tr.mat-mdc-row')!.click();
    expect(open).toHaveBeenCalled();
    expect(open.mock.calls[0]![1]).toMatchObject({ data: { record: payslip } });
  });

  it('loads payroll records for the current employee', async () => {
    const { search } = await setup('Employee');
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ employeeId: 'e1' }));
  });
});
