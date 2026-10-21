import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { ApiError } from '@shared/api/errors';
import type { SaveEmployeeRequest } from '@shared/api/types';
import { SALARYNET_API } from '../../core/api';
import { noa } from '../../shared/testing';
import { EmployeeDialog, type EmployeeDialogData } from './employee-dialog';

const departments = [{ id: 'd1', name: 'Engineering', description: '', employeeCount: 1, activeEmployeeCount: 1, createdAt: '' }];

async function setup(data: EmployeeDialogData, create: (r: SaveEmployeeRequest) => Promise<unknown> = async () => noa) {
  localStorage.clear();
  const close = vi.fn();
  const createSpy = vi.fn(create);
  TestBed.configureTestingModule({
    imports: [EmployeeDialog],
    providers: [
      provideRouter([]),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close } },
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
      { provide: SALARYNET_API, useValue: { employees: { create: createSpy, update: vi.fn(async () => noa) } } },
    ],
  });
  const fixture = TestBed.createComponent(EmployeeDialog);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement, close, createSpy };
}

const type = (el: HTMLElement, id: string, value: string) => {
  const input = el.querySelector<HTMLInputElement>(id)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};
const submit = async (fixture: Awaited<ReturnType<typeof setup>>['fixture']) => {
  (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('EmployeeDialog', () => {
  it('shows the server-style messages and does not save an empty form', async () => {
    const { fixture, el, createSpy } = await setup({ employee: null, departments });
    await submit(fixture);
    expect(createSpy).not.toHaveBeenCalled();
    const errors = [...el.querySelectorAll('small.error')].map((e) => e.textContent!.trim());
    expect(errors).toContain("'First Name' must not be empty.");
    expect(errors).toContain("'Last Name' must not be empty.");
  });

  it('starts a new employee in the first department at 12,000', async () => {
    const { fixture } = await setup({ employee: null, departments });
    const form = (fixture.componentInstance as unknown as { form: { getRawValue(): SaveEmployeeRequest } }).form.getRawValue();
    expect(form.departmentId).toBe('d1');
    expect(form.baseSalary).toBe(12000);
  });

  it('puts a server validation error under the matching field', async () => {
    const { fixture, el } = await setup({ employee: null, departments }, async () => {
      throw new ApiError(400, 'Validation', undefined, { Email: ['An employee with this email already exists.'] });
    });
    type(el, '#firstName', 'Mobile');
    type(el, '#lastName', 'Tester');
    type(el, '#email', 'noa.cohen@salarynet.demo');
    await submit(fixture);
    expect(el.querySelector('#email')!.closest('.field')!.querySelector('small.error')!.textContent).toContain('already exists');
  });

  it('creates the employee and closes with the result', async () => {
    const { fixture, el, close, createSpy } = await setup({ employee: null, departments });
    type(el, '#firstName', 'Mobile');
    type(el, '#lastName', 'Tester');
    type(el, '#email', 'mobile.tester@salarynet.demo');
    await submit(fixture);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Mobile', departmentId: 'd1', baseSalary: 12000 }));
    expect(close).toHaveBeenCalledWith(noa);
  });

  it('fills the form when editing', async () => {
    const { el } = await setup({ employee: noa, departments });
    expect(el.querySelector<HTMLInputElement>('#firstName')!.value).toBe('Noa');
  });
});
