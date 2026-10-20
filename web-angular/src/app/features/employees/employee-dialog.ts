import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, type AbstractControl, type ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { Department, Employee, EmploymentType, SaveEmployeeRequest } from '@shared/api/types';
import { translateServerMessage } from '@shared/i18n/serverMessages';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { TermPipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';

export interface EmployeeDialogData {
  employee: Employee | null;
  departments: Department[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same messages the API (and the shared demo engine) return, so they are translated by one table.
const messages: Record<string, string> = {
  firstName: "'First Name' must not be empty.",
  lastName: "'Last Name' must not be empty.",
  email: "'Email' is not a valid email address.",
  departmentId: 'Please choose a department.',
  baseSalary: "'Base Salary' must be greater than '0'.",
};

const notBlank = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };
const positive = (control: AbstractControl): ValidationErrors | null => (Number(control.value) > 0 ? null : { min: true });

@Component({
  selector: 'app-employee-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, TranslatePipe, TermPipe],
  templateUrl: './employee-dialog.html',
  styles: `
    .form-grid { padding-top: 0.25rem; }
    mat-form-field { width: 100%; }
  `,
})
export class EmployeeDialog {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly ref = inject(MatDialogRef<EmployeeDialog, Employee>);
  private readonly i18n = inject(LocaleService);
  protected readonly data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly types: EmploymentType[] = ['FullTime', 'PartTime', 'Contractor'];

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: [this.data.employee?.firstName ?? '', notBlank],
    lastName: [this.data.employee?.lastName ?? '', notBlank],
    email: [this.data.employee?.email ?? '', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    departmentId: [this.data.employee?.departmentId ?? this.data.departments[0]?.id ?? '', Validators.required],
    employmentType: [this.data.employee?.employmentType ?? ('FullTime' as EmploymentType)],
    baseSalary: [this.data.employee?.baseSalary ?? 12_000, positive],
  });

  /** The message under a field: a server error if there is one, else the client rule it breaks. */
  protected error(field: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const server = control.errors?.['server'] as string | undefined;
    const message = server ?? messages[field];
    return message ? (translateServerMessage(message, this.i18n.locale()) ?? message) : null;
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const request: SaveEmployeeRequest = this.form.getRawValue();
    try {
      const saved = this.data.employee
        ? await this.api.employees.update(this.data.employee.id, request)
        : await this.api.employees.create(request);
      this.ref.close(saved);
    } catch (e) {
      // Server validation (for example a duplicate email) lands on the matching field.
      for (const [field, message] of Object.entries(this.errors.handle(e))) {
        const control = this.form.get(field);
        control?.setErrors({ server: message });
        control?.markAsTouched();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
