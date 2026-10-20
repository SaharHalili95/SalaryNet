import { Component, computed, inject, PendingTasks, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import type { AttendanceLog, Employee, PayrollRecord } from '@shared/api/types';
import { formatHours, formatMoney, formatMoneyCompact, formatMonthShort, formatPeriod } from '@shared/format/format';
import type { ChartConfiguration } from 'chart.js';
import { SALARYNET_API } from '../../core/api';
import { ApiErrorService } from '../../core/api-error.service';
import { ClockPipe, HoursPipe, MoneyPipe, PersonPipe, ShortDatePipe, TermPipe } from '../../core/format.pipes';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ChartCanvas, type ChartTokens } from '../../shared/chart-canvas';
import { StatTile } from '../../shared/stat-tile';

@Component({
  selector: 'app-me',
  imports: [MatButtonModule, MatIconModule, ChartCanvas, StatTile, TranslatePipe, MoneyPipe, ShortDatePipe, ClockPipe, HoursPipe, TermPipe, PersonPipe],
  templateUrl: './me.html',
  styleUrl: './me.css',
})
export class Me {
  private readonly api = inject(SALARYNET_API);
  private readonly errors = inject(ApiErrorService);
  private readonly pending = inject(PendingTasks);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly i18n = inject(LocaleService);

  protected readonly me = signal<Employee | null>(null);
  protected readonly payslips = signal<PayrollRecord[]>([]);
  protected readonly shifts = signal<AttendanceLog[]>([]);
  protected readonly openShift = signal<AttendanceLog | null>(null);
  protected readonly busy = signal(false);

  private readonly thisYear = new Date().getFullYear();
  private readonly monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  protected readonly latest = computed(() => this.payslips()[0] ?? null);
  protected readonly thisYearSlips = computed(() => this.payslips().filter((p) => p.year === this.thisYear));
  protected readonly ytdGross = computed(() => this.thisYearSlips().reduce((sum, p) => sum + p.grossSalary, 0));
  protected readonly ytdNet = computed(() => this.thisYearSlips().reduce((sum, p) => sum + p.netSalary, 0));
  protected readonly monthShifts = computed(() => this.shifts().filter((s) => s.checkIn >= this.monthStart && !s.isOpen));
  protected readonly monthHours = computed(() => this.monthShifts().reduce((sum, s) => sum + s.totalHours, 0));
  protected readonly recentShifts = computed(() => this.shifts().slice(0, 4));

  protected readonly netChart = computed(() => {
    const recent = [...this.payslips()].slice(0, 6).reverse();
    const locale = this.i18n.locale();
    const rtl = this.i18n.isRtl();
    const label = this.i18n.t('dashboard.net');
    return (tk: ChartTokens): ChartConfiguration => ({
      type: 'bar',
      data: {
        labels: recent.map((p) => formatMonthShort(p.year, p.month, locale)),
        datasets: [{ label, data: recent.map((p) => p.netSalary), backgroundColor: tk.series1, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 36 }],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl, backgroundColor: tk.surface, titleColor: tk.text, bodyColor: tk.text, borderColor: tk.grid, borderWidth: 1,
            callbacks: { label: (c) => ` ${formatMoney(c.parsed.y ?? 0, locale)}` },
          },
        },
        scales: {
          x: { reverse: rtl, grid: { display: false }, border: { display: false }, ticks: { color: tk.text } },
          y: {
            position: rtl ? 'right' : 'left', beginAtZero: true, border: { display: false }, grid: { color: tk.grid },
            ticks: { color: tk.text, callback: (v) => formatMoneyCompact(Number(v), locale) },
          },
        },
      },
    });
  });

  constructor() {
    // Registered as pending work, so Angular (and tests) know the page is still loading.
    void this.pending.run(() => this.load());
  }

  protected money(value: number, compact = false): string {
    return compact ? formatMoneyCompact(value, this.i18n.locale()) : formatMoney(value, this.i18n.locale());
  }

  protected period(p: PayrollRecord): string {
    return formatPeriod(p.year, p.month, this.i18n.locale());
  }

  protected hours(value: number): string {
    return formatHours(value, this.i18n.locale());
  }

  protected openPage(path: string): void {
    void this.router.navigate([path]);
  }

  protected async toggleShift(): Promise<void> {
    this.busy.set(true);
    try {
      if (this.openShift()) {
        const closed = await this.api.attendance.checkOut();
        this.notify(`${this.i18n.t('attendance.checkedOutToast')}: ${this.i18n.t('attendance.shiftLength', { hours: this.hours(closed.totalHours) })}`);
      } else {
        await this.api.attendance.checkIn();
        this.notify(`${this.i18n.t('attendance.checkedInToast')}: ${this.i18n.t('attendance.checkedInDetail')}`);
      }
      await this.pending.run(() => this.load());
    } catch (e) {
      this.errors.handle(e);
    } finally {
      this.busy.set(false);
    }
  }

  private notify(message: string): void {
    this.snackBar.open(message, undefined, { duration: 4000, direction: this.i18n.isRtl() ? 'rtl' : 'ltr' });
  }

  private async load(): Promise<void> {
    try {
      const [employee, payroll, attendance, current] = await Promise.all([
        this.api.employees.mine(),
        this.api.payroll.search({ pageSize: 100 }),
        this.api.attendance.search({ pageSize: 100 }),
        this.api.attendance.current(),
      ]);
      this.me.set(employee);
      this.payslips.set(payroll.items);
      this.shifts.set(attendance.items);
      this.openShift.set(current);
    } catch (e) {
      this.errors.handle(e);
    }
  }
}
