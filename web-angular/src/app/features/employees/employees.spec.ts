import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import type { Employee, EmployeeQuery, PagedResult } from '@shared/api/types';
import { of } from 'rxjs';
import { SALARYNET_API } from '../../core/api';
import { providePaginatorIntl } from '../../core/paginator-intl';
import { noa, page } from '../../shared/testing';
import { Employees } from './employees';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const dana: Employee = { ...noa, id: 'e2', firstName: 'Dana', lastName: 'Levi', email: 'dana.levi@salarynet.demo' };

async function setup(search: (q: EmployeeQuery) => Promise<PagedResult<Employee>>, dialogResult: Employee | undefined = undefined) {
  localStorage.clear();
  const searchSpy = vi.fn(search);
  const open = vi.fn(() => ({ afterClosed: () => of(dialogResult) }));
  TestBed.configureTestingModule({
    imports: [Employees],
    providers: [
      providePaginatorIntl(),
      provideRouter([]),
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
      { provide: MatDialog, useValue: { open } },
      { provide: SALARYNET_API, useValue: { employees: { search: searchSpy }, departments: { list: async () => [] } } },
    ],
  });
  const fixture = TestBed.createComponent(Employees);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, searchSpy, open };
}

const typeSearch = (el: HTMLElement, value: string) => {
  const input = el.querySelector<HTMLInputElement>('.toolbar input')!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('Employees', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('loads the first page of active employees sorted by last name', async () => {
    const { searchSpy } = await setup(async () => page([noa]));
    await vi.advanceTimersByTimeAsync(300);
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy.mock.calls[0]![0]).toMatchObject({ page: 1, pageSize: 10, sortBy: 'LastName', sortDirection: 'Asc', isActive: true });
  });

  it('sends one request after typing pauses', async () => {
    const { fixture, el, searchSpy } = await setup(async () => page([noa]));
    await vi.advanceTimersByTimeAsync(300);
    searchSpy.mockClear();
    for (const text of ['N', 'No', 'Noa']) {
      typeSearch(el, text);
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(200);
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy.mock.calls[0]![0]).toMatchObject({ search: 'Noa', page: 1 });
  });

  it('never lets a slow, older response overwrite a newer one', async () => {
    const slow = deferred<PagedResult<Employee>>();
    const fast = deferred<PagedResult<Employee>>();
    const { fixture, el, searchSpy } = await setup((q) => (q.search === 'Noa' ? slow.promise : q.search === 'Dana' ? fast.promise : Promise.resolve(page([]))));
    await vi.advanceTimersByTimeAsync(300);
    typeSearch(el, 'Noa');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    typeSearch(el, 'Dana');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    expect(searchSpy.mock.calls.map(([q]) => q.search)).toEqual([undefined, 'Noa', 'Dana']);
    fast.resolve(page([dana]));
    await vi.advanceTimersByTimeAsync(0);
    slow.resolve(page([noa]));
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    const rows = el.querySelectorAll('tr.mat-mdc-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.textContent).toContain('Dana');
  });

  it('reloads page 1 after a new employee is created', async () => {
    const { el, searchSpy, open, fixture } = await setup(async () => page([noa]), dana);
    await vi.advanceTimersByTimeAsync(300);
    searchSpy.mockClear();
    el.querySelector<HTMLButtonElement>('.page-header button')!.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(open).toHaveBeenCalled();
    expect(searchSpy).toHaveBeenCalledTimes(1);
    expect(searchSpy.mock.calls[0]![0]).toMatchObject({ page: 1 });
  });
});
