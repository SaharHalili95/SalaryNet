import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Employee, PayrollRecord } from '@shared/api/types';
import { monthOptions } from '@shared/format/format';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { LocaleService } from '../../core/locale.service';
import { PersonPipe, TermPipe } from '../../core/format.pipes';
import { TranslatePipe } from '../../core/translate.pipe';

export interface GenerateDialogData { employees: Employee[] }

@Component({
  selector: 'app-generate-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, TranslatePipe, PersonPipe, TermPipe],
  template: `
    <h2 mat-dialog-title>{{ 'payroll.generateTitle' | t }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full"><mat-label>{{ 'common.employee' | t }}</mat-label>
          <mat-select formControlName="employeeId"><mat-option value="">{{ 'payroll.chooseEmployee' | t }}</mat-option>
            @for (employee of data.employees; track employee.id) { <mat-option [value]="employee.id">{{ (employee.firstName + ' ' + employee.lastName) | person }} · {{ employee.departmentName | term }}</mat-option> }
          </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>{{ 'common.month' | t }}</mat-label><mat-select formControlName="month">
          @for (month of months; track month.value) { <mat-option [value]="month.value">{{ month.label }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>{{ 'common.year' | t }}</mat-label><mat-select formControlName="year">
          @for (year of years; track year) { <mat-option [value]="year">{{ year }}</mat-option> }
        </mat-select></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>{{ 'payroll.bonus' | t }}</mat-label>
          <input matInput type="number" min="0" formControlName="bonus" /></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | t }}</button>
      <button mat-flat-button type="button" [disabled]="form.invalid || busy()" (click)="generate()">{{ 'payroll.generate' | t }}</button>
    </mat-dialog-actions>
  `,
  styles: `.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .25rem .75rem; padding-top: .5rem; } .full { grid-column: 1 / -1; } mat-form-field { width: 100%; }`,
})
export class GenerateDialog {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(LocaleService);
  private readonly ref = inject(MatDialogRef<GenerateDialog, PayrollRecord>);
  protected readonly data = inject<GenerateDialogData>(MAT_DIALOG_DATA);
  protected readonly months = monthOptions(this.i18n.locale());
  protected readonly years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  protected readonly busy = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    employeeId: ['', Validators.required], year: [new Date().getFullYear(), Validators.required],
    month: [new Date().getMonth() + 1, Validators.required], bonus: [0, Validators.min(0)],
  });

  protected async generate(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);
    try { this.ref.close(await this.api.payroll.generate(this.form.getRawValue())); }
    catch (e) { this.errors.handle(e); this.snackBar.open(this.i18n.t('errors.409'), undefined, { duration: 4000 }); }
    finally { this.busy.set(false); }
  }
}
