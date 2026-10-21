import { Component, inject, PendingTasks, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import type { Department, Employee, PayrollQuery, PayrollRecord } from '@shared/api/types';
import { monthOptions } from '@shared/format/format';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { AuthService } from '../../core/auth.service';
import { MoneyPipe, PeriodPipe, PersonPipe, TermPipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { dialogSize } from '../../shared/dialog-sizes';
import { PayslipDialog } from '../../shared/payslip-dialog';
import { GenerateDialog, type GenerateDialogData } from './generate-dialog';
import { RunMonthDialog } from './run-month-dialog';

@Component({
  selector: 'app-payroll',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, MatSelectModule, MatTableModule,
    TranslatePipe, MoneyPipe, PeriodPipe, PersonPipe, TermPipe],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class Payroll {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly pending = inject(PendingTasks);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(LocaleService);
  protected readonly columns = ['period', 'employee', 'department', 'gross', 'deductions', 'net'];
  protected readonly records = signal<PayrollRecord[]>([]);
  protected readonly departments = signal<Department[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly months = monthOptions(this.i18n.locale());
  protected readonly years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  protected readonly query = signal<PayrollQuery>({ page: 1, pageSize: 10 });

  constructor() {
    void this.pending.run(async () => {
      if (this.auth.isStaff()) {
        try { this.departments.set(await this.api.departments.list()); } catch (e) { this.errors.handle(e); }
      }
      await this.load();
    });
  }

  protected filter<K extends 'year' | 'month' | 'departmentId'>(key: K, value: PayrollQuery[K] | null): void {
    this.query.update((current) => ({ ...current, [key]: value ?? undefined, page: 1 }));
    void this.load();
  }

  protected page(event: PageEvent): void {
    this.query.update((current) => ({ ...current, page: event.pageIndex + 1, pageSize: event.pageSize }));
    void this.load();
  }

  protected view(record: PayrollRecord): void {
    this.dialog.open(PayslipDialog, { ...dialogSize('30rem'), data: { record } });
  }

  protected async generate(): Promise<void> {
    let employees: Employee[];
    try { employees = (await this.api.employees.search({ isActive: true, pageSize: 100 })).items; }
    catch (e) { this.errors.handle(e); return; }
    const data: GenerateDialogData = { employees };
    this.dialog.open<GenerateDialog, GenerateDialogData, PayrollRecord>(GenerateDialog, { ...dialogSize('32rem'), data })
      .afterClosed().subscribe((record) => {
        if (!record) return;
        this.snackBar.open(this.i18n.t('payroll.generate'), undefined, { duration: 3000 });
        void this.load();
        this.view(record);
      });
  }

  protected runMonth(): void {
    this.dialog.open(RunMonthDialog, { ...dialogSize('26rem') }).afterClosed().subscribe((result) => {
      if (!result) return;
      this.snackBar.open(this.i18n.t('payroll.runDetail', { generated: result.generated, skipped: result.skipped }), undefined, { duration: 5000 });
      void this.load();
    });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const query = { ...this.query(), ...(this.auth.isStaff() ? {} : { employeeId: this.auth.user()?.employeeId ?? undefined }) };
      const result = await this.api.payroll.search(query);
      this.records.set(result.items);
      this.total.set(result.totalCount);
    } catch (e) { this.errors.handle(e); }
    finally { this.loading.set(false); }
  }
}
