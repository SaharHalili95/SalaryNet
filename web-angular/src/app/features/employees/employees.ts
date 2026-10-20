import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Department, Employee, EmployeeQuery, EmployeeSortField, EmploymentType, PagedResult } from '@shared/api/types';
import { localizeName } from '@shared/i18n/dataGlossary';
import {
  BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, EMPTY, filter, from, map, startWith, Subject, switchMap, tap,
} from 'rxjs';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { MoneyPipe, PersonPipe, ShortDatePipe, TermPipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ConfirmDialog, type ConfirmDialogData } from '../../shared/confirm-dialog';
import { dialogSize } from '../../shared/dialog-sizes';
import { EmployeeDialog, type EmployeeDialogData } from './employee-dialog';

type Filters = Pick<EmployeeQuery, 'departmentId' | 'employmentType' | 'isActive' | 'sortBy' | 'sortDirection'>;

const SORT_FIELDS: Record<string, EmployeeSortField> = { lastName: 'LastName', baseSalary: 'BaseSalary', createdAt: 'CreatedAt' };
const EMPTY_PAGE: PagedResult<Employee> = { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 };

@Component({
  selector: 'app-employees',
  imports: [
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSortModule,
    MatTableModule, MatTooltipModule, TranslatePipe, MoneyPipe, ShortDatePipe, TermPipe, PersonPipe,
  ],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(LocaleService);

  protected readonly columns = ['lastName', 'departmentName', 'employmentType', 'baseSalary', 'createdAt', 'status', 'actions'];
  protected readonly types: EmploymentType[] = ['FullTime', 'PartTime', 'Contractor'];
  protected readonly departments = signal<Department[]>([]);
  protected readonly result = signal(EMPTY_PAGE);
  protected readonly loading = signal(false);

  protected readonly search = signal('');
  protected readonly filters = signal<Filters>({ sortBy: 'LastName', sortDirection: 'Asc', isActive: true });
  private readonly paging = new BehaviorSubject({ page: 1, pageSize: 10 });
  private readonly reload = new Subject<void>();

  constructor() {
    const search$ = toObservable(this.search).pipe(debounceTime(300), distinctUntilChanged());

    // One stream for every way the list can change. New search text or filters start again at page 1, and
    // switchMap drops an older response that arrives late, so the table always shows the latest query.
    combineLatest([search$, toObservable(this.filters)])
      .pipe(
        switchMap(([search, filters]) => {
          this.paging.next({ page: 1, pageSize: this.paging.value.pageSize });
          return this.paging.pipe(map((paging) => ({ ...filters, ...paging, search: search || undefined })));
        }),
        switchMap((query) => this.reload.pipe(startWith(undefined), map(() => query))),
        tap(() => this.loading.set(true)),
        switchMap((query) =>
          from(this.api.employees.search(query)).pipe(
            catchError((e: unknown) => {
              this.errors.handle(e);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });

    void this.loadDepartments();
    inject(DestroyRef).onDestroy(() => this.reload.complete());
  }

  protected setFilter(patch: Partial<Filters>): void {
    this.filters.update((current) => ({ ...current, ...patch }));
  }

  protected onPage(event: PageEvent): void {
    this.paging.next({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }

  protected onSort(sort: Sort): void {
    this.setFilter(
      sort.direction
        ? { sortBy: SORT_FIELDS[sort.active] ?? 'LastName', sortDirection: sort.direction === 'desc' ? 'Desc' : 'Asc' }
        : { sortBy: 'LastName', sortDirection: 'Asc' },
    );
  }

  protected openDialog(employee: Employee | null): void {
    const data: EmployeeDialogData = { employee, departments: this.departments() };
    this.dialog
      .open<EmployeeDialog, EmployeeDialogData, Employee>(EmployeeDialog, { ...dialogSize('36rem'), data })
      .afterClosed()
      .pipe(filter((saved): saved is Employee => !!saved))
      .subscribe((saved) => {
        this.notify(this.i18n.t(employee ? 'employees.updated' : 'employees.created'), `${saved.firstName} ${saved.lastName}`);
        if (employee) this.reload.next();
        else this.paging.next({ page: 1, pageSize: this.paging.value.pageSize });
      });
  }

  protected toggleActive(employee: Employee): void {
    const activate = !employee.isActive;
    const name = localizeName(`${employee.firstName} ${employee.lastName}`, this.i18n.locale());
    const data: ConfirmDialogData = {
      title: this.i18n.t(activate ? 'employees.reactivateHeader' : 'employees.deactivateHeader'),
      message: this.i18n.t(activate ? 'employees.reactivateMessage' : 'employees.deactivateMessage', { name }),
      confirm: this.i18n.t(activate ? 'employees.reactivate' : 'employees.deactivate'),
      cancel: this.i18n.t('common.cancel'),
      danger: !activate,
    };
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { ...dialogSize('28rem'), data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(async () => {
        try {
          await this.api.employees.setActive(employee.id, activate);
          this.notify(this.i18n.t(activate ? 'employees.reactivated' : 'employees.deactivated'));
          this.reload.next();
        } catch (e) {
          this.errors.handle(e);
        }
      });
  }

  private notify(title: string, detail?: string): void {
    this.snackBar.open(detail ? `${title}: ${detail}` : title, undefined, { duration: 3000, direction: this.i18n.isRtl() ? 'rtl' : 'ltr' });
  }

  private async loadDepartments(): Promise<void> {
    try {
      this.departments.set(await this.api.departments.list());
    } catch (e) {
      this.errors.handle(e);
    }
  }
}
