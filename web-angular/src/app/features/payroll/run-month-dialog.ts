import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import type { MonthlyPayrollResult } from '@shared/api/types';
import { monthOptions } from '@shared/format/format';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-run-month-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'payroll.runTitle' | t }}</h2><mat-dialog-content>
      <p>{{ 'payroll.runIntro' | t }}</p>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline"><mat-label>{{ 'common.month' | t }}</mat-label><mat-select formControlName="month">
          @for (month of months; track month.value) { <mat-option [value]="month.value">{{ month.label }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>{{ 'common.year' | t }}</mat-label><mat-select formControlName="year">
          @for (year of years; track year) { <mat-option [value]="year">{{ year }}</mat-option> }
        </mat-select></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | t }}</button>
      <button mat-flat-button type="button" [disabled]="busy()" (click)="run()">{{ 'payroll.runButton' | t }}</button>
    </mat-dialog-actions>
  `,
  styles: `.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; padding-top: .5rem; } mat-form-field { width: 100%; }`,
})
export class RunMonthDialog {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly ref = inject(MatDialogRef<RunMonthDialog, MonthlyPayrollResult>);
  private readonly i18n = inject(LocaleService);
  protected readonly months = monthOptions(this.i18n.locale());
  protected readonly years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  protected readonly busy = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({ year: [new Date().getFullYear(), Validators.required], month: [new Date().getMonth() + 1, Validators.required] });

  protected async run(): Promise<void> {
    this.busy.set(true);
    const { year, month } = this.form.getRawValue();
    try { this.ref.close(await this.api.payroll.runMonth(year, month)); }
    catch (e) { this.errors.handle(e); }
    finally { this.busy.set(false); }
  }
}
