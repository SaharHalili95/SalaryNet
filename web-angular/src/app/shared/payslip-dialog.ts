import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { PayrollRecord } from '@shared/api/types';
import { MoneyPipe, PeriodPipe, ShortDatePipe } from '../core/format.pipes';
import { TranslatePipe } from '../core/translate.pipe';

export interface PayslipDialogData { record: PayrollRecord | null }

@Component({
  selector: 'app-payslip-dialog',
  imports: [MatDialogModule, MatButtonModule, MoneyPipe, PeriodPipe, ShortDatePipe, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'payslip.title' | t }}</h2>
    <mat-dialog-content>
      @if (data.record; as record) {
        <p class="period">{{ record.year | period: record.month }}</p>
        <p class="issued">{{ 'payslip.issued' | t: { date: record.generatedAt | shortDate } }}</p>
        <dl class="lines">
          <div><dt>{{ 'payslip.baseSalary' | t }}</dt><dd>{{ record.baseSalary | money }}</dd></div>
          <div><dt>{{ 'payslip.bonus' | t }}</dt><dd>{{ record.bonus | money }}</dd></div>
          <div class="total"><dt>{{ 'payslip.gross' | t }}</dt><dd>{{ record.grossSalary | money }}</dd></div>
          <div><dt>{{ 'payslip.incomeTax' | t }} <small>{{ 'payslip.tiered' | t }}</small></dt><dd class="money neg">−{{ record.incomeTax | money }}</dd></div>
          <div><dt>{{ 'payslip.socialSecurity' | t }}</dt><dd class="money neg">−{{ record.socialSecurity | money }}</dd></div>
          <div class="total"><dt>{{ 'payslip.totalDeductions' | t }}</dt><dd class="money neg">−{{ record.deductions | money }}</dd></div>
          <div class="net"><dt>{{ 'payslip.net' | t }}</dt><dd>{{ record.netSalary | money }}</dd></div>
        </dl>
        <p class="disclaimer">{{ 'payslip.note' | t }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'common.cancel' | t }}</button></mat-dialog-actions>
  `,
  styles: `
    .period { margin: 0; font-size: 1.15rem; font-weight: 600; }
    .issued, .disclaimer { color: var(--text-muted); font-size: .875rem; }
    .lines { margin: 1.25rem 0; }
    .lines > div { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem 0; border-bottom: 1px solid var(--border); }
    dt, dd { margin: 0; } dd { font-variant-numeric: tabular-nums; text-align: end; }
    .total { font-weight: 600; } .net { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    .neg { color: var(--danger); } small { color: var(--text-muted); }
  `,
})
export class PayslipDialog {
  protected readonly data = inject<PayslipDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<PayslipDialog>);
}
